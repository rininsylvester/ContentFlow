import type Stripe from "stripe";

export const USER_ID = "11111111-1111-4111-8111-111111111111";
export const PERIOD_START = 1_760_000_000; // 2025-10-09
export const PERIOD_END = PERIOD_START + 30 * 86_400;

/** Minimal Stripe objects with only the fields the handlers read. */
export function subscription(overrides: Partial<Stripe.Subscription> = {}): Stripe.Subscription {
  return {
    id: "sub_123",
    object: "subscription",
    customer: "cus_123",
    status: "active",
    cancel_at_period_end: false,
    metadata: { userId: USER_ID },
    items: {
      object: "list",
      data: [{ current_period_start: PERIOD_START, current_period_end: PERIOD_END }],
    },
    ...overrides,
  } as unknown as Stripe.Subscription;
}

export function event<T extends Stripe.Event["type"]>(
  type: T,
  object: unknown,
  id = `evt_${type}`,
): Stripe.Event {
  return { id, object: "event", type, data: { object } } as unknown as Stripe.Event;
}
