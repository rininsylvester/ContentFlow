import "server-only";
import { z } from "zod";

const serverSchema = z.object({
  DATABASE_URL: z.string().min(1),
  // Required from Phase 2 / Phase 5 respectively; optional until those features ship.
  ANTHROPIC_API_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_ID: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | undefined;

/** Validated server-only env. Parsed lazily so builds don't need secrets. */
export function serverEnv(): ServerEnv {
  cached ??= serverSchema.parse(process.env);
  return cached;
}
