import Stripe from "stripe";
import { describe, expect, it, vi } from "vitest";
import { billingStateFromSubscription, mapStripeStatus } from "@/lib/billing/subscription-state";
import { handleStripeEvent, type WebhookDeps } from "@/lib/billing/webhook-handlers";
import { event, PERIOD_END, PERIOD_START, subscription, USER_ID } from "../fixtures/stripe";

function fakeDeps(sub = subscription()) {
  return {
    retrieveSubscription: vi.fn(async () => sub),
    findUserIdByCustomer: vi.fn(async (_customerId: string): Promise<string | null> => null),
    updateUserBilling: vi.fn(async () => true),
  } satisfies WebhookDeps;
}

describe("mapStripeStatus", () => {
  it.each([
    ["active", "active"],
    ["trialing", "active"],
    ["past_due", "past_due"],
    ["unpaid", "unpaid"],
    ["paused", "unpaid"],
    ["incomplete", "incomplete"],
    ["incomplete_expired", "canceled"],
    ["canceled", "canceled"],
  ] as const)("%s -> %s", (stripe, app) => {
    expect(mapStripeStatus(stripe)).toBe(app);
  });
});

describe("billingStateFromSubscription", () => {
  it("reads the billing period from subscription items", () => {
    expect(billingStateFromSubscription(subscription({ cancel_at_period_end: true }))).toEqual({
      stripeSubscriptionId: "sub_123",
      subscriptionStatus: "active",
      cancelAtPeriodEnd: true,
      currentPeriodStart: new Date(PERIOD_START * 1000),
      currentPeriodEnd: new Date(PERIOD_END * 1000),
    });
  });

  it("tolerates a subscription without items", () => {
    const state = billingStateFromSubscription(subscription({ items: undefined }));
    expect(state.currentPeriodStart).toBeNull();
    expect(state.currentPeriodEnd).toBeNull();
  });
});

describe("handleStripeEvent", () => {
  it("checkout.session.completed: fetches the subscription and activates the user", async () => {
    const deps = fakeDeps();
    const result = await handleStripeEvent(
      event("checkout.session.completed", {
        mode: "subscription",
        subscription: "sub_123",
        customer: "cus_123",
        client_reference_id: USER_ID,
        metadata: {},
      }),
      deps,
    );
    expect(result).toEqual({ status: "processed", userId: USER_ID });
    expect(deps.retrieveSubscription).toHaveBeenCalledWith("sub_123");
    expect(deps.updateUserBilling).toHaveBeenCalledWith(USER_ID, {
      stripeCustomerId: "cus_123",
      stripeSubscriptionId: "sub_123",
      subscriptionStatus: "active",
      cancelAtPeriodEnd: false,
      currentPeriodStart: new Date(PERIOD_START * 1000),
      currentPeriodEnd: new Date(PERIOD_END * 1000),
    });
  });

  it("checkout.session.completed: ignores one-off payments", async () => {
    const deps = fakeDeps();
    const result = await handleStripeEvent(
      event("checkout.session.completed", { mode: "payment" }),
      deps,
    );
    expect(result.status).toBe("ignored");
    expect(deps.updateUserBilling).not.toHaveBeenCalled();
  });

  it("customer.subscription.updated: re-fetches the latest state (out-of-order safe)", async () => {
    const latest = subscription({ cancel_at_period_end: true });
    const deps = fakeDeps(latest);
    const stale = subscription({ status: "incomplete" });
    await handleStripeEvent(event("customer.subscription.updated", stale), deps);
    expect(deps.retrieveSubscription).toHaveBeenCalledWith("sub_123");
    expect(deps.updateUserBilling).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({ subscriptionStatus: "active", cancelAtPeriodEnd: true }),
    );
  });

  it("customer.subscription.deleted: marks the subscription canceled from the payload", async () => {
    const deps = fakeDeps();
    await handleStripeEvent(
      event("customer.subscription.deleted", subscription({ status: "canceled" })),
      deps,
    );
    expect(deps.retrieveSubscription).not.toHaveBeenCalled();
    expect(deps.updateUserBilling).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({
        subscriptionStatus: "canceled",
        currentPeriodEnd: new Date(PERIOD_END * 1000),
      }),
    );
  });

  it("invoice.payment_failed: syncs past_due from the invoice's subscription", async () => {
    const deps = fakeDeps(subscription({ status: "past_due" }));
    await handleStripeEvent(
      event("invoice.payment_failed", {
        parent: { subscription_details: { subscription: "sub_123" } },
      }),
      deps,
    );
    expect(deps.updateUserBilling).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({ subscriptionStatus: "past_due" }),
    );
  });

  it("falls back to the customer id when metadata has no user", async () => {
    const deps = fakeDeps(subscription({ metadata: {} }));
    deps.findUserIdByCustomer.mockResolvedValue(USER_ID);
    const result = await handleStripeEvent(
      event("customer.subscription.updated", subscription({ metadata: {} })),
      deps,
    );
    expect(deps.findUserIdByCustomer).toHaveBeenCalledWith("cus_123");
    expect(result).toEqual({ status: "processed", userId: USER_ID });
  });

  it("ignores metadata user ids that aren't UUIDs", async () => {
    const deps = fakeDeps(subscription({ metadata: { userId: "'; drop table users;--" } }));
    const result = await handleStripeEvent(
      event("customer.subscription.updated", subscription()),
      deps,
    );
    expect(result).toEqual({ status: "ignored", reason: "no user for subscription sub_123" });
  });

  it("ignores events it doesn't handle", async () => {
    const deps = fakeDeps();
    expect(await handleStripeEvent(event("customer.created", {}), deps)).toEqual({
      status: "ignored",
      reason: "unhandled event type customer.created",
    });
  });

  it("is idempotent: replaying an event produces the same update", async () => {
    const deps = fakeDeps();
    const e = event("customer.subscription.deleted", subscription({ status: "canceled" }));
    await handleStripeEvent(e, deps);
    await handleStripeEvent(e, deps);
    expect(deps.updateUserBilling.mock.calls[0]).toEqual(deps.updateUserBilling.mock.calls[1]);
  });
});

describe("webhook signature verification", () => {
  const stripe = new Stripe("sk_test_dummy");
  const secret = "whsec_test_secret";
  const payload = JSON.stringify({
    id: "evt_1",
    object: "event",
    type: "customer.created",
    data: { object: {} },
  });

  it("accepts a correctly signed payload", async () => {
    const header = await stripe.webhooks.generateTestHeaderStringAsync({ payload, secret });
    const evt = await stripe.webhooks.constructEventAsync(payload, header, secret);
    expect(evt.id).toBe("evt_1");
  });

  it("rejects a tampered payload or wrong secret", async () => {
    const header = await stripe.webhooks.generateTestHeaderStringAsync({ payload, secret });
    await expect(
      stripe.webhooks.constructEventAsync(payload.replace("evt_1", "evt_2"), header, secret),
    ).rejects.toThrow();
    await expect(
      stripe.webhooks.constructEventAsync(payload, header, "whsec_other"),
    ).rejects.toThrow();
  });
});
