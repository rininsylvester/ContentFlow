import type Stripe from "stripe";
import { z } from "zod";
import { billingStateFromSubscription, type BillingState } from "./subscription-state";

export type BillingPatch = Partial<BillingState> & { stripeCustomerId?: string };

/** Side effects the handlers need, injected so they can be unit-tested without Stripe or a DB. */
export type WebhookDeps = {
  retrieveSubscription: (id: string) => Promise<Stripe.Subscription>;
  findUserIdByCustomer: (customerId: string) => Promise<string | null>;
  updateUserBilling: (userId: string, patch: BillingPatch) => Promise<boolean>;
};

export type WebhookResult =
  { status: "processed"; userId: string } | { status: "ignored"; reason: string };

export const HANDLED_EVENTS = [
  "checkout.session.completed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_failed",
] as const;

const uuid = z.uuid();
const idOf = (value: string | { id: string } | null | undefined) =>
  typeof value === "string" ? value : (value?.id ?? null);

async function resolveUserId(
  deps: WebhookDeps,
  candidates: (string | null | undefined)[],
  customerId: string | null,
): Promise<string | null> {
  for (const c of candidates) if (c && uuid.safeParse(c).success) return c;
  return customerId ? deps.findUserIdByCustomer(customerId) : null;
}

async function syncSubscription(
  deps: WebhookDeps,
  sub: Stripe.Subscription,
  extra: { userIdHint?: string | null } = {},
): Promise<WebhookResult> {
  const customerId = idOf(sub.customer);
  const userId = await resolveUserId(deps, [sub.metadata?.userId, extra.userIdHint], customerId);
  if (!userId) return { status: "ignored", reason: `no user for subscription ${sub.id}` };
  const updated = await deps.updateUserBilling(userId, {
    ...billingStateFromSubscription(sub),
    ...(customerId ? { stripeCustomerId: customerId } : {}),
  });
  return updated
    ? { status: "processed", userId }
    : { status: "ignored", reason: `user ${userId} not found` };
}

/**
 * Applies a verified Stripe event to the user's billing state. Every handler
 * syncs the full subscription state (not a delta), so replays and
 * out-of-order deliveries converge on the correct result.
 */
export async function handleStripeEvent(
  event: Stripe.Event,
  deps: WebhookDeps,
): Promise<WebhookResult> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.mode !== "subscription")
        return { status: "ignored", reason: "not a subscription checkout" };
      const subscriptionId = idOf(session.subscription);
      if (!subscriptionId)
        return { status: "ignored", reason: "checkout session has no subscription" };
      const sub = await deps.retrieveSubscription(subscriptionId);
      return syncSubscription(deps, sub, {
        userIdHint: session.client_reference_id ?? session.metadata?.userId,
      });
    }
    case "customer.subscription.updated":
      // Re-fetch so a late, out-of-order event can't overwrite newer state.
      return syncSubscription(deps, await deps.retrieveSubscription(event.data.object.id));
    case "customer.subscription.deleted":
      // A deleted subscription is final; the payload is authoritative.
      return syncSubscription(deps, event.data.object);
    case "invoice.payment_failed": {
      const subscriptionId = idOf(event.data.object.parent?.subscription_details?.subscription);
      if (!subscriptionId)
        return { status: "ignored", reason: "invoice is not for a subscription" };
      return syncSubscription(deps, await deps.retrieveSubscription(subscriptionId));
    }
    default:
      return { status: "ignored", reason: `unhandled event type ${event.type}` };
  }
}
