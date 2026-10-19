import "server-only";
import { planForUser } from "@/lib/billing/entitlements";
import { getBrandProfile } from "@/lib/db/queries/brand-profiles";
import {
  recordPeriodUsage,
  refundGeneration,
  reserveGeneration,
  type Reservation,
} from "@/lib/db/queries/billing";
import {
  completeGeneration,
  createPendingGeneration,
  failGeneration,
} from "@/lib/db/queries/generations";
import { getUsageSummary } from "@/lib/db/queries/usage";
import { findUserById } from "@/lib/db/queries/users";
import { checkRateLimit } from "@/lib/rate-limit";
import { buildBrandVoiceBlock } from "./brand-voice";
import { estimateCostMicros } from "./cost";
import { AI_ERROR_MESSAGES, AiError, REFUNDABLE, type AiErrorCode } from "./errors";
import { MODEL_FOR_TASK, MODELS } from "./models";
import { parseModelOutput } from "./parse";
import { encodeEvent, type StreamEvent } from "./protocol";
import { assertProviderConfigured, ClientAbortedError, streamCompletion } from "./provider";
import type { TaskDefinition } from "./tasks";

/** One retry when the model's JSON fails validation. */
const MAX_ATTEMPTS = 2;

export type GenerationRequest = {
  userId: string;
  task: TaskDefinition;
  input: unknown;
  useBrandVoice: boolean;
  parentId?: string;
  signal: AbortSignal;
};

/**
 * Runs every check that must pass before a generation starts, reserves one
 * unit of the user's allowance, and returns a stream of NDJSON events.
 * Throws AiError for failures that happen before streaming begins.
 */
export async function startGeneration(req: GenerationRequest): Promise<ReadableStream<Uint8Array>> {
  assertProviderConfigured();

  const limit = await checkRateLimit(req.userId);
  if (!limit.ok) throw new AiError("rate_limited", 429, limit.retryAfterSeconds);

  const user = await findUserById(req.userId);
  if (!user) throw new AiError("unauthorized", 401);

  const reserved = await reserveGeneration(user.id, planForUser(user));
  if (!reserved.ok) throw new AiError(reserved.code, 402);
  const { reservation } = reserved;

  const brandVoice = req.useBrandVoice
    ? buildBrandVoiceBlock(await getBrandProfile(user.id))
    : null;
  const model = MODELS[MODEL_FOR_TASK[req.task.id]];
  const { prompt } = req.task;

  let generationId: string;
  try {
    generationId = await createPendingGeneration({
      userId: user.id,
      tool: req.task.tool,
      input: req.input,
      model: model.id,
      promptVersion: prompt.version,
      brandVoiceApplied: brandVoice !== null,
      billedAs: reservation.billedAs,
      parentId: req.parentId,
    });
  } catch (error) {
    await refundGeneration(reservation);
    throw error;
  }

  const system = brandVoice ? `${prompt.system}\n\n${brandVoice}` : prompt.system;
  const userPrompt = prompt.buildUser(req.input);
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (event: StreamEvent) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(encodeEvent(event)));
        } catch {
          closed = true; // client went away
        }
      };

      const startedAt = Date.now();
      let inputTokens = 0;
      let outputTokens = 0;
      send({ type: "start", generationId });

      try {
        let output: unknown;
        for (let attempt = 1; ; attempt++) {
          if (attempt > 1) send({ type: "reset" });
          const result = await streamCompletion({
            taskId: req.task.id,
            model,
            system,
            user: userPrompt,
            maxTokens: prompt.maxTokens,
            outputSchema: req.task.outputSchema,
            timeoutMs: prompt.timeoutMs,
            signal: req.signal,
            onText: (text) => send({ type: "delta", text }),
          });
          inputTokens += result.inputTokens;
          outputTokens += result.outputTokens;

          const parsed = result.incomplete
            ? ({ ok: false, error: "Output was cut off" } as const)
            : parseModelOutput(result.text, req.task.outputSchema);
          if (parsed.ok) {
            output = parsed.data;
            break;
          }
          console.warn(`[ai] ${req.task.id} attempt ${attempt} invalid: ${parsed.error}`);
          if (attempt >= MAX_ATTEMPTS) throw new AiError("invalid_output", 502);
        }

        const costUsdMicros = estimateCostMicros(model, { inputTokens, outputTokens });
        const latencyMs = Date.now() - startedAt;
        await completeGeneration(generationId, {
          output,
          inputTokens,
          outputTokens,
          costUsdMicros,
          latencyMs,
        });
        await recordPeriodUsage(reservation, { inputTokens, outputTokens, costUsdMicros });
        logUsage(req.task.id, model.id, { inputTokens, outputTokens, costUsdMicros, latencyMs });

        const fresh = await findUserById(user.id);
        send({
          type: "done",
          generationId,
          output,
          usage: fresh ? await getUsageSummary(fresh) : null,
        });
      } catch (error) {
        const code: AiErrorCode | "aborted" =
          error instanceof ClientAbortedError
            ? "aborted"
            : error instanceof AiError
              ? error.code
              : "provider_error";
        if (!(error instanceof AiError) && !(error instanceof ClientAbortedError)) {
          console.error("[ai] unexpected generation failure", error);
        }
        await settleFailure(generationId, reservation, code, {
          inputTokens,
          outputTokens,
          latencyMs: Date.now() - startedAt,
          costUsdMicros: estimateCostMicros(model, { inputTokens, outputTokens }),
        });
        if (code !== "aborted") send({ type: "error", code, message: AI_ERROR_MESSAGES[code] });
      } finally {
        if (!closed) {
          closed = true;
          try {
            controller.close();
          } catch {
            // already closed
          }
        }
      }
    },
  });
}

async function settleFailure(
  generationId: string,
  reservation: Reservation,
  code: AiErrorCode | "aborted",
  usage: { inputTokens: number; outputTokens: number; latencyMs: number; costUsdMicros: number },
) {
  const refunded = code !== "aborted" && REFUNDABLE.has(code);
  try {
    if (refunded) await refundGeneration(reservation);
    await failGeneration(generationId, { errorCode: code, refunded, ...usage });
  } catch (error) {
    console.error("[ai] failed to record generation failure", error);
  }
}

function logUsage(
  taskId: string,
  model: string,
  usage: { inputTokens: number; outputTokens: number; costUsdMicros: number; latencyMs: number },
) {
  console.info(JSON.stringify({ event: "ai_generation", task: taskId, model, ...usage }));
}
