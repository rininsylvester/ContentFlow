import type { AiErrorCode } from "./errors";
import type { UsageSummary } from "@/lib/billing/usage-summary";

/**
 * Newline-delimited JSON events streamed from POST /api/ai/[task].
 * Shared by the route handler and the client hook.
 */
export type StreamEvent =
  | { type: "start"; generationId: string }
  | { type: "delta"; text: string }
  /** Output failed validation and is being regenerated; discard text received so far. */
  | { type: "reset" }
  | { type: "done"; generationId: string; output: unknown; usage: UsageSummary | null }
  | { type: "error"; code: AiErrorCode; message: string; retryAfterSeconds?: number };

export function encodeEvent(event: StreamEvent): string {
  return `${JSON.stringify(event)}\n`;
}
