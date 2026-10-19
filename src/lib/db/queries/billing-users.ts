import "server-only";
import { eq } from "drizzle-orm";
import type { BillingPatch } from "@/lib/billing/webhook-handlers";
import { getDb } from "@/lib/db/client";
import { stripeEvents, users } from "@/lib/db/schema";

export async function updateUserBilling(userId: string, patch: BillingPatch): Promise<boolean> {
  const rows = await getDb()
    .update(users)
    .set(patch)
    .where(eq(users.id, userId))
    .returning({ id: users.id });
  return rows.length > 0;
}

export async function setStripeCustomerId(userId: string, customerId: string): Promise<void> {
  await getDb().update(users).set({ stripeCustomerId: customerId }).where(eq(users.id, userId));
}

export async function findUserIdByCustomer(customerId: string): Promise<string | null> {
  const [row] = await getDb()
    .select({ id: users.id })
    .from(users)
    .where(eq(users.stripeCustomerId, customerId))
    .limit(1);
  return row?.id ?? null;
}

export async function isEventProcessed(eventId: string): Promise<boolean> {
  const [row] = await getDb()
    .select({ id: stripeEvents.id })
    .from(stripeEvents)
    .where(eq(stripeEvents.id, eventId))
    .limit(1);
  return Boolean(row);
}

export async function recordEvent(eventId: string, type: string): Promise<void> {
  await getDb().insert(stripeEvents).values({ id: eventId, type }).onConflictDoNothing();
}
