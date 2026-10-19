export const AI_ERROR_CODES = [
  "unauthorized",
  "bad_request",
  "rate_limited",
  "trial_exhausted",
  "cap_reached",
  "timeout",
  "provider_error",
  "invalid_output",
  "not_configured",
] as const;
export type AiErrorCode = (typeof AI_ERROR_CODES)[number];

export const AI_ERROR_MESSAGES: Record<AiErrorCode, string> = {
  unauthorized: "Your session has expired. Please sign in again.",
  bad_request: "Some fields need attention. Check your input and try again.",
  rate_limited: "You're generating very quickly. Wait a few seconds and try again.",
  trial_exhausted: "You've used your 5 free generations. Subscribe to keep creating.",
  cap_reached:
    "You've reached this month's fair-use limit. It resets with your next billing period.",
  timeout: "The AI took too long to respond. Your input is saved — please try again.",
  provider_error: "The AI service had a problem. Your input is saved — please try again.",
  invalid_output: "The AI returned an unexpected result. Please try again.",
  not_configured: "AI generation isn't configured on this server yet.",
};

/** Errors that don't consume a generation (the reserved unit is refunded). */
export const REFUNDABLE: ReadonlySet<AiErrorCode> = new Set([
  "timeout",
  "provider_error",
  "invalid_output",
]);

export class AiError extends Error {
  constructor(
    readonly code: AiErrorCode,
    readonly status: number,
    readonly retryAfterSeconds?: number,
  ) {
    super(AI_ERROR_MESSAGES[code]);
    this.name = "AiError";
  }
}
