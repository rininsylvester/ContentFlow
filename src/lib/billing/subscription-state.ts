import type Stripe from "stripe";
import type { SubscriptionStatus } from "@/lib/db/schema/enums";

export type BillingState = {
  stripeSubscriptionId: string;
  subscriptionStatus: SubscriptionStatus;
  cancelAtPeriodEnd: boolean;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
};

/** Collapse Stripe's statuses into the ones the app acts on. */
export function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
      return "past_due";
    case "unpaid":
    case "paused":
      return "unpaid";
    case "incomplete":
      return "incomplete";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    default:
      return "incomplete";
  }
}

const toDate = (seconds: number | null | undefined) =>
  typeof seconds === "number" ? new Date(seconds * 1000) : null;

/**
 * Billing fields stored on the user, derived from a Stripe subscription.
 * The billing period lives on subscription items in current API versions.
 */
export function billingStateFromSubscription(sub: Stripe.Subscription): BillingState {
  const items = sub.items?.data ?? [];
  const starts = items
    .map((i) => i.current_period_start)
    .filter((n): n is number => typeof n === "number");
  const ends = items
    .map((i) => i.current_period_end)
    .filter((n): n is number => typeof n === "number");
  return {
    stripeSubscriptionId: sub.id,
    subscriptionStatus: mapStripeStatus(sub.status),
    cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
    currentPeriodStart: toDate(starts.length ? Math.min(...starts) : null),
    currentPeriodEnd: toDate(ends.length ? Math.max(...ends) : null),
  };
}
