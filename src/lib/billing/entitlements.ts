import type { SubscriptionStatus } from "@/lib/db/schema";
import { PLAN } from "./plan";
import { hasActiveSubscription } from "./usage-summary";

export type BillingPlan =
  | { kind: "subscription"; periodStart: Date; periodEnd: Date; cap: number }
  | { kind: "trial"; limit: number };

/** Which allowance a user's next generation is charged against. Pure; tested. */
export function planForUser(
  user: {
    subscriptionStatus: SubscriptionStatus;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
  },
  now: Date = new Date(),
): BillingPlan {
  if (!hasActiveSubscription(user.subscriptionStatus, user.currentPeriodEnd, now)) {
    return { kind: "trial", limit: PLAN.trialGenerations };
  }
  if (user.currentPeriodStart && user.currentPeriodEnd) {
    return {
      kind: "subscription",
      periodStart: user.currentPeriodStart,
      periodEnd: user.currentPeriodEnd,
      cap: PLAN.monthlyGenerationCap,
    };
  }
  // Active but period dates not synced yet (webhook lag): fall back to the calendar month.
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { kind: "subscription", periodStart, periodEnd, cap: PLAN.monthlyGenerationCap };
}
