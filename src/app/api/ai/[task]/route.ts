import { z } from "zod";
import { getSessionUserId } from "@/lib/auth";
import { AI_ERROR_MESSAGES, AiError, type AiErrorCode } from "@/lib/ai/errors";
import type { StreamEvent } from "@/lib/ai/protocol";
import { startGeneration } from "@/lib/ai/run";
import { getTask } from "@/lib/ai/tasks";
import { isOwnGeneration } from "@/lib/db/queries/generations";

export const maxDuration = 120;

const envelopeSchema = z.object({
  input: z.unknown(),
  useBrandVoice: z.boolean().default(true),
  parentId: z.uuid().optional(),
});

function errorResponse(code: AiErrorCode, status: number, retryAfterSeconds?: number) {
  const body: StreamEvent = {
    type: "error",
    code,
    message: AI_ERROR_MESSAGES[code],
    retryAfterSeconds,
  };
  return Response.json(body, {
    status,
    headers: retryAfterSeconds ? { "Retry-After": String(retryAfterSeconds) } : undefined,
  });
}

export async function POST(request: Request, ctx: RouteContext<"/api/ai/[task]">) {
  const userId = await getSessionUserId();
  if (!userId) return errorResponse("unauthorized", 401);

  const { task: taskId } = await ctx.params;
  const task = getTask(taskId);
  if (!task) return errorResponse("bad_request", 404);

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return errorResponse("bad_request", 400);
  }
  const envelope = envelopeSchema.safeParse(raw);
  if (!envelope.success) return errorResponse("bad_request", 400);

  const input = task.inputSchema.safeParse(envelope.data.input);
  if (!input.success) return errorResponse("bad_request", 400);

  const { parentId, useBrandVoice } = envelope.data;
  if (parentId && !(await isOwnGeneration(userId, parentId))) {
    return errorResponse("bad_request", 400);
  }

  try {
    const stream = await startGeneration({
      userId,
      task,
      input: input.data,
      useBrandVoice,
      parentId,
      signal: request.signal,
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-store, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    if (error instanceof AiError)
      return errorResponse(error.code, error.status, error.retryAfterSeconds);
    console.error("[ai] failed to start generation", error);
    return errorResponse("provider_error", 500);
  }
}
