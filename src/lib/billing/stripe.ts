import "server-only";
import Stripe from "stripe";
import { serverEnv } from "@/lib/env.server";

export class BillingNotConfiguredError extends Error {
  constructor(missing: string) {
    super(`Billing is not configured: ${missing} is missing`);
    this.name = "BillingNotConfiguredError";
  }
}

let client: Stripe | undefined;

export function getStripe(): Stripe {
  const env = serverEnv();
  if (!env.STRIPE_SECRET_KEY) throw new BillingNotConfiguredError("STRIPE_SECRET_KEY");
  if (!client) {
    const local = env.STRIPE_API_URL ? new URL(env.STRIPE_API_URL) : null;
    client = new Stripe(env.STRIPE_SECRET_KEY, {
      maxNetworkRetries: 2,
      appInfo: { name: "CreatorHub" },
      ...(local && {
        host: local.hostname,
        port: local.port,
        protocol: local.protocol === "http:" ? "http" : "https",
      }),
    });
  }
  return client;
}

export function getPriceId(): string {
  const price = serverEnv().STRIPE_PRICE_ID;
  if (!price) throw new BillingNotConfiguredError("STRIPE_PRICE_ID");
  return price;
}

export function getWebhookSecret(): string {
  const secret = serverEnv().STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new BillingNotConfiguredError("STRIPE_WEBHOOK_SECRET");
  return secret;
}

/** Whether Checkout can work on this server (secret key and price configured). */
export function isBillingConfigured(): boolean {
  const env = serverEnv();
  return Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_PRICE_ID);
}
