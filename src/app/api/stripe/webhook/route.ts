import type Stripe from "stripe";
import { BillingNotConfiguredError, getStripe, getWebhookSecret } from "@/lib/billing/stripe";
import { handleStripeEvent, type WebhookDeps } from "@/lib/billing/webhook-handlers";
import {
  findUserIdByCustomer,
  isEventProcessed,
  recordEvent,
  updateUserBilling,
} from "@/lib/db/queries/billing-users";

/**
 * Stripe webhook. The raw body is read as text so the signature can be
 * verified; unsigned or tampered requests are rejected with 400.
 * Returning 5xx makes Stripe retry, so handler errors surface as 500.
 */
export async function POST(request: Request) {
  let stripe: Stripe;
  let secret: string;
  try {
    stripe = getStripe();
    secret = getWebhookSecret();
  } catch (error) {
    if (error instanceof BillingNotConfiguredError) {
      console.error(`[billing] webhook rejected: ${error.message}`);
      return Response.json({ error: "Billing not configured" }, { status: 503 });
    }
    throw error;
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return Response.json({ error: "Missing signature" }, { status: 400 });

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, secret);
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (await isEventProcessed(event.id)) {
    return Response.json({ received: true, duplicate: true });
  }

  const deps: WebhookDeps = {
    retrieveSubscription: (id) => stripe.subscriptions.retrieve(id),
    findUserIdByCustomer,
    updateUserBilling,
  };

  try {
    const result = await handleStripeEvent(event, deps);
    await recordEvent(event.id, event.type);
    console.info(
      JSON.stringify({ event: "stripe_webhook", type: event.type, id: event.id, ...result }),
    );
    return Response.json({ received: true, ...result });
  } catch (error) {
    console.error(`[billing] webhook ${event.type} ${event.id} failed`, error);
    return Response.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
