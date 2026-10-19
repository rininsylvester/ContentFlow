/**
 * The single place model choices and prices live.
 *
 * Every task currently uses Claude Haiku 5.5 — the cheapest current Claude
 * model — per product decision. To move a task to a stronger model, add it to
 * MODELS and point that task at it in MODEL_FOR_TASK.
 */
export const MODELS = {
  haiku: {
    id: "claude-haiku-5-5",
    // USD per million tokens, for prompts up to `longContextThreshold` input tokens.
    inputUsdPerMTok: 0.1,
    outputUsdPerMTok: 0.5,
    longContextThreshold: 100_000,
    longInputUsdPerMTok: 0.5,
    longOutputUsdPerMTok: 2.5,
  },
} as const;

export type ModelKey = keyof typeof MODELS;
export type ModelConfig = (typeof MODELS)[ModelKey];

export const TASK_IDS = [
  "ideas",
  "ideas-expand",
  "script",
  "script-section",
  "hooks",
  "seo",
  "aesthetics",
  "repurpose",
] as const;
export type TaskId = (typeof TASK_IDS)[number];

export const MODEL_FOR_TASK: Record<TaskId, ModelKey> = {
  ideas: "haiku",
  "ideas-expand": "haiku",
  script: "haiku",
  "script-section": "haiku",
  hooks: "haiku",
  seo: "haiku",
  aesthetics: "haiku",
  repurpose: "haiku",
};

/**
 * Request settings shared by every call. Structured JSON generation doesn't
 * benefit from extended thinking, so it's disabled (allowed on Haiku 5.5 at
 * effort `high` or below) and effort is `low` to keep cost and latency down.
 */
export const GENERATION_SETTINGS = {
  thinking: { type: "disabled" },
  effort: "low",
} as const;
