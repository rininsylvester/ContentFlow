import { integer, pgTable, primaryKey, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { createdAt, ownerSelectPolicy, updatedAt } from "./helpers";
import { users } from "./users";

/** Fair-use counter per subscriber per Stripe billing period. */
export const usagePeriods = pgTable(
  "usage_periods",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
    periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
    generationsUsed: integer("generations_used").notNull().default(0),
    generationCap: integer("generation_cap").notNull(),
    inputTokens: integer("input_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull().default(0),
    costUsdMicros: integer("cost_usd_micros").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    unique("usage_periods_user_period_key").on(t.userId, t.periodStart),
    ownerSelectPolicy("usage_periods", t.userId),
  ],
).enableRLS();

/** Processed Stripe event ids, for idempotent webhook handling. Server-only. */
export const stripeEvents = pgTable("stripe_events", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

/** Fixed-window request counters for per-user rate limiting. Server-only. */
export const rateLimits = pgTable(
  "rate_limits",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    count: integer("count").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.userId, t.windowStart] })],
).enableRLS();

export type UsagePeriod = typeof usagePeriods.$inferSelect;
