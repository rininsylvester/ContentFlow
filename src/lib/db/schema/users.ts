import { integer, pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";
import { subscriptionStatusEnum } from "./enums";
import { createdAt, ownerAllPolicy, ownerSelectPolicy, updatedAt } from "./helpers";

/**
 * App-level user profile. One row per auth.users row, created by the
 * `on_auth_user_created` trigger (see the custom migration).
 * Subscription columns are written only by the server (Stripe webhooks).
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id")
      .primaryKey()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    displayName: text("display_name"),
    avatarUrl: text("avatar_url"),
    onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
    trialGenerationsUsed: integer("trial_generations_used").notNull().default(0),
    stripeCustomerId: text("stripe_customer_id").unique(),
    stripeSubscriptionId: text("stripe_subscription_id").unique(),
    subscriptionStatus: subscriptionStatusEnum("subscription_status").notNull().default("none"),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [ownerSelectPolicy("users", t.id)],
).enableRLS();

export const brandProfiles = pgTable(
  "brand_profiles",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    niche: text("niche"),
    audience: text("audience"),
    tone: text("tone"),
    wordsToUse: text("words_to_use").array().notNull().default([]),
    wordsToAvoid: text("words_to_avoid").array().notNull().default([]),
    exampleContent: text("example_content"),
    platforms: text("platforms").array().notNull().default([]),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [ownerAllPolicy("brand_profiles", t.userId)],
).enableRLS();

export type User = typeof users.$inferSelect;
export type BrandProfile = typeof brandProfiles.$inferSelect;
