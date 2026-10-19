import type { SubscriptionStatus } from "@/lib/db/schema";
import { PLAN } from "./plan";

export type UsageSummary =
  | { kind: "trial"; used: number; limit: number; remaining: number }
  | {
      kind: "subscription";
      used: number;
      limit: number;
      remaining: number;
      resetsAt: Date | null;
      status: SubscriptionStatus;
    };

/** Statuses that keep paid access (past_due stays active during Stripe's retries). */
export const ACTIVE_STATUSES: ReadonlySet<SubscriptionStatus> = new Set(["active", "past_due"]);

export function hasActiveSubscription(
  status: SubscriptionStatus,
  currentPeriodEnd: Date | null,
  now: Date = new Date(),
): boolean {
  if (ACTIVE_STATUSES.has(status)) return true;
  // Canceled subscriptions keep access until the paid period ends.
  return status === "canceled" && currentPeriodEnd !== null && currentPeriodEnd > now;
}

export function summarizeUsage(
  user: {
    subscriptionStatus: SubscriptionStatus;
    currentPeriodEnd: Date | null;
    trialGenerationsUsed: number;
  },
  periodGenerationsUsed: number | null,
  now: Date = new Date(),
): UsageSummary {
  if (hasActiveSubscription(user.subscriptionStatus, user.currentPeriodEnd, now)) {
    const used = periodGenerationsUsed ?? 0;
    const limit = PLAN.monthlyGenerationCap;
    return {
      kind: "subscription",
      used,
      limit,
      remaining: Math.max(0, limit - used),
      resetsAt: user.currentPeriodEnd,
      status: user.subscriptionStatus,
    };
  }
  const limit = PLAN.trialGenerations;
  const used = user.trialGenerationsUsed;
  return { kind: "trial", used, limit, remaining: Math.max(0, limit - used) };
}
