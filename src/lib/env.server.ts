import "server-only";
import { z } from "zod";

/** Treat empty strings (e.g. `KEY=` in .env files) as unset. */
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (v === "" ? undefined : v), schema.optional());

const serverSchema = z.object({
  DATABASE_URL: z.string().min(1),
  // Optional so the app boots without it; AI routes return `not_configured` until set
  // (or use AI_MOCK=1 locally).
  ANTHROPIC_API_KEY: optional(z.string()),
  // Stripe (Phase 5). Billing routes return 503 until these are set.
  STRIPE_SECRET_KEY: optional(z.string()),
  STRIPE_WEBHOOK_SECRET: optional(z.string()),
  STRIPE_PRICE_ID: optional(z.string()),
  // Optional: point the Stripe SDK at stripe-mock or another local fake, e.g. http://localhost:12111.
  STRIPE_API_URL: optional(z.url()),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | undefined;

/** Validated server-only env. Parsed lazily so builds don't need secrets. */
export function serverEnv(): ServerEnv {
  cached ??= serverSchema.parse(process.env);
  return cached;
}
