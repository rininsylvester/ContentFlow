import type { ModelConfig } from "./models";

/** Estimated cost of one call in integer micro-dollars (1 USD = 1,000,000). */
export function estimateCostMicros(
  model: ModelConfig,
  usage: { inputTokens: number; outputTokens: number },
): number {
  const long = usage.inputTokens > model.longContextThreshold;
  const inRate = long ? model.longInputUsdPerMTok : model.inputUsdPerMTok;
  const outRate = long ? model.longOutputUsdPerMTok : model.outputUsdPerMTok;
  // USD per million tokens is numerically equal to micro-dollars per token.
  return Math.ceil(usage.inputTokens * inRate + usage.outputTokens * outRate);
}
