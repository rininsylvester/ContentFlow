import "server-only";
import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

/**
 * Finds or creates an auth user directly in the local database (the signup
 * trigger creates the profile). Only reachable when local dev sign-in is on.
 */
export async function findOrCreateLocalUser(
  email: string,
  name?: string,
): Promise<{ id: string; onboarded: boolean }> {
  const db = getDb();
  const [existing] = await db
    .select({ id: users.id, onboardedAt: users.onboardedAt })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing) return { id: existing.id, onboarded: existing.onboardedAt !== null };

  const id = randomUUID();
  const meta = JSON.stringify(name ? { full_name: name } : {});
  await db.execute(
    sql`insert into auth.users (id, email, raw_user_meta_data) values (${id}, ${email}, ${meta}::jsonb)`,
  );
  return { id, onboarded: false };
}

/** Demo only: pretend the user has an active subscription for the next 30 days. */
export async function activateLocalSubscription(userId: string): Promise<void> {
  const now = new Date();
  await getDb()
    .update(users)
    .set({
      subscriptionStatus: "active",
      cancelAtPeriodEnd: false,
      currentPeriodStart: now,
      currentPeriodEnd: new Date(now.getTime() + 30 * 86_400_000),
      stripeSubscriptionId: null,
    })
    .where(eq(users.id, userId));
}
