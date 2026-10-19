import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { planForUser } from "@/lib/billing/entitlements";
import { handleStripeEvent, type WebhookDeps } from "@/lib/billing/webhook-handlers";
import { reserveGeneration } from "@/lib/db/queries/billing";
import {
  findUserIdByCustomer,
  isEventProcessed,
  recordEvent,
  updateUserBilling,
} from "@/lib/db/queries/billing-users";
import { getDb } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { findUserById } from "@/lib/db/queries/users";
import { event, subscription } from "../fixtures/stripe";

const enabled = Boolean(process.env.DATABASE_URL);

describe.skipIf(!enabled)("billing webhooks (integration)", () => {
  afterAll(async () => {
    await getDb().execute(sql`delete from auth.users where email like '%@test.dev'`);
  });

  it("checkout → subscriber cap; payment failure keeps access; deletion ends it at period end", async () => {
    const userId = randomUUID();
    await getDb().execute(
      sql`insert into auth.users (id, email) values (${userId}, ${`${userId}@test.dev`})`,
    );
    // Use up the trial first.
    await getDb().update(users).set({ trialGenerationsUsed: 5 }).where(eq(users.id, userId));

    const now = Math.floor(Date.now() / 1000);
    let current = subscription({
      id: "sub_int",
      customer: `cus_${userId.slice(0, 8)}`,
      metadata: { userId },
      items: {
        object: "list",
        data: [{ current_period_start: now - 86_400, current_period_end: now + 29 * 86_400 }],
      },
    } as never);
    const deps: WebhookDeps = {
      retrieveSubscription: async () => current,
      findUserIdByCustomer,
      updateUserBilling,
    };

    await handleStripeEvent(
      event("checkout.session.completed", {
        mode: "subscription",
        subscription: "sub_int",
        customer: current.customer,
        client_reference_id: userId,
      }),
      deps,
    );
    let user = await findUserById(userId);
    expect(user).toMatchObject({ subscriptionStatus: "active", stripeSubscriptionId: "sub_int" });
    const plan = planForUser(user!);
    expect(plan).toMatchObject({ kind: "subscription", cap: 400 });
    expect((await reserveGeneration(userId, plan)).ok).toBe(true);

    current = { ...current, status: "past_due" } as typeof current;
    await handleStripeEvent(
      event("invoice.payment_failed", {
        parent: { subscription_details: { subscription: "sub_int" } },
      }),
      { ...deps, retrieveSubscription: async () => current },
    );
    user = await findUserById(userId);
    expect(user?.subscriptionStatus).toBe("past_due");
    expect(planForUser(user!).kind).toBe("subscription");

    // Customer lookup works without metadata.
    expect(await findUserIdByCustomer(current.customer as string)).toBe(userId);

    await handleStripeEvent(
      event("customer.subscription.deleted", { ...current, status: "canceled" }),
      deps,
    );
    user = await findUserById(userId);
    expect(user?.subscriptionStatus).toBe("canceled");
    // Still within the paid period → still has access.
    expect(planForUser(user!).kind).toBe("subscription");
    // After the period ends → back to the (exhausted) trial.
    expect(planForUser(user!, new Date((now + 31 * 86_400) * 1000)).kind).toBe("trial");
  });

  it("records processed event ids for idempotency", async () => {
    const id = `evt_${randomUUID()}`;
    expect(await isEventProcessed(id)).toBe(false);
    await recordEvent(id, "customer.subscription.updated");
    await recordEvent(id, "customer.subscription.updated");
    expect(await isEventProcessed(id)).toBe(true);
  });
});
