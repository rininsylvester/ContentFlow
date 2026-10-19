import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";
import { serverEnv } from "@/lib/env.server";
import { AiError } from "./errors";
import { mockCompletion, MockProviderError } from "./mock";
import { GENERATION_SETTINGS, type ModelConfig, type TaskId } from "./models";

export type CompletionRequest = {
  taskId: TaskId;
  model: ModelConfig;
  system: string;
  user: string;
  maxTokens: number;
  outputSchema: z.ZodType;
  timeoutMs: number;
  /** Aborted when the client disconnects. */
  signal: AbortSignal;
  onText: (text: string) => void;
};

export type CompletionResult = {
  text: string;
  inputTokens: number;
  outputTokens: number;
  /** True when the model hit max_tokens or stopped for safety, so the JSON is unusable. */
  incomplete: boolean;
};

let client: Anthropic | undefined;

function getClient(): Anthropic {
  const apiKey = serverEnv().ANTHROPIC_API_KEY;
  if (!apiKey) throw new AiError("not_configured", 503);
  client ??= new Anthropic({ apiKey, maxRetries: 1 });
  return client;
}

/** Sample output for local development and tests. Never active in production builds. */
export function isMockMode(): boolean {
  return process.env.AI_MOCK === "1" && process.env.NODE_ENV !== "production";
}

/** Throws early (before a generation is reserved) if no provider is usable. */
export function assertProviderConfigured(): void {
  if (!isMockMode()) getClient();
}

export class ClientAbortedError extends Error {}

/** Streams one structured-output completion. Text deltas go to `onText`. */
export async function streamCompletion(req: CompletionRequest): Promise<CompletionResult> {
  const timeout = AbortSignal.timeout(req.timeoutMs);
  const signal = AbortSignal.any([req.signal, timeout]);

  try {
    if (isMockMode()) return await mockCompletion(req.taskId, signal, req.onText);

    const stream = getClient().messages.stream(
      {
        model: req.model.id,
        max_tokens: req.maxTokens,
        system: req.system,
        messages: [{ role: "user", content: req.user }],
        thinking: GENERATION_SETTINGS.thinking,
        output_config: {
          effort: GENERATION_SETTINGS.effort,
          format: zodOutputFormat(req.outputSchema),
        },
      },
      { signal },
    );
    stream.on("text", req.onText);
    const message = await stream.finalMessage();
    const text = message.content.map((block) => (block.type === "text" ? block.text : "")).join("");

    return {
      text,
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
      incomplete: message.stop_reason === "max_tokens" || message.stop_reason === "refusal",
    };
  } catch (error) {
    if (req.signal.aborted) throw new ClientAbortedError();
    if (timeout.aborted || error instanceof Anthropic.APIConnectionTimeoutError) {
      throw new AiError("timeout", 504);
    }
    if (error instanceof AiError) throw error;
    if (error instanceof MockProviderError) throw new AiError("provider_error", 502);
    if (
      error instanceof Anthropic.AuthenticationError ||
      error instanceof Anthropic.PermissionDeniedError
    ) {
      console.error("[ai] provider credentials rejected", error.status);
      throw new AiError("not_configured", 503);
    }
    if (error instanceof Anthropic.APIError) {
      console.error("[ai] provider error", error.status, error.message);
      throw new AiError("provider_error", 502);
    }
    throw error;
  }
}
