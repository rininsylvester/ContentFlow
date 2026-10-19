import "server-only";
import { and, eq, lt, sql } from "drizzle-orm";
import type { BillingPlan } from "@/lib/billing/entitlements";
import { getDb } from "@/lib/db/client";
import { usagePeriods, users } from "@/lib/db/schema";

export type Reservation =
  | { billedAs: "trial"; userId: string }
  | { billedAs: "subscription"; userId: string; periodStart: Date };

export type ReserveResult =
  { ok: true; reservation: Reservation } | { ok: false; code: "trial_exhausted" | "cap_reached" };

/**
 * Atomically claims one generation from the user's allowance. The conditional
 * UPDATE means concurrent requests can never exceed the limit.
 */
export async function reserveGeneration(userId: string, plan: BillingPlan): Promise<ReserveResult> {
  const db = getDb();

  if (plan.kind === "trial") {
    const rows = await db
      .update(users)
      .set({ trialGenerationsUsed: sql`${users.trialGenerationsUsed} + 1` })
      .where(and(eq(users.id, userId), lt(users.trialGenerationsUsed, plan.limit)))
      .returning({ used: users.trialGenerationsUsed });
    return rows.length > 0
      ? { ok: true, reservation: { billedAs: "trial", userId } }
      : { ok: false, code: "trial_exhausted" };
  }

  await db
    .insert(usagePeriods)
    .values({
      userId,
      periodStart: plan.periodStart,
      periodEnd: plan.periodEnd,
      generationCap: plan.cap,
    })
    .onConflictDoNothing({ target: [usagePeriods.userId, usagePeriods.periodStart] });

  const rows = await db
    .update(usagePeriods)
    .set({ generationsUsed: sql`${usagePeriods.generationsUsed} + 1` })
    .where(
      and(
        eq(usagePeriods.userId, userId),
        eq(usagePeriods.periodStart, plan.periodStart),
        lt(usagePeriods.generationsUsed, usagePeriods.generationCap),
      ),
    )
    .returning({ used: usagePeriods.generationsUsed });

  return rows.length > 0
    ? { ok: true, reservation: { billedAs: "subscription", userId, periodStart: plan.periodStart } }
    : { ok: false, code: "cap_reached" };
}

/** Gives back a reserved generation after a failure that wasn't the user's fault. */
export async function refundGeneration(reservation: Reservation): Promise<void> {
  const db = getDb();
  if (reservation.billedAs === "trial") {
    await db
      .update(users)
      .set({ trialGenerationsUsed: sql`greatest(${users.trialGenerationsUsed} - 1, 0)` })
      .where(eq(users.id, reservation.userId));
    return;
  }
  await db
    .update(usagePeriods)
    .set({ generationsUsed: sql`greatest(${usagePeriods.generationsUsed} - 1, 0)` })
    .where(
      and(
        eq(usagePeriods.userId, reservation.userId),
        eq(usagePeriods.periodStart, reservation.periodStart),
      ),
    );
}

/** Adds token and cost totals to the subscriber's current usage period. */
export async function recordPeriodUsage(
  reservation: Reservation,
  usage: { inputTokens: number; outputTokens: number; costUsdMicros: number },
): Promise<void> {
  if (reservation.billedAs !== "subscription") return;
  await getDb()
    .update(usagePeriods)
    .set({
      inputTokens: sql`${usagePeriods.inputTokens} + ${usage.inputTokens}`,
      outputTokens: sql`${usagePeriods.outputTokens} + ${usage.outputTokens}`,
      costUsdMicros: sql`${usagePeriods.costUsdMicros} + ${usage.costUsdMicros}`,
    })
    .where(
      and(
        eq(usagePeriods.userId, reservation.userId),
        eq(usagePeriods.periodStart, reservation.periodStart),
      ),
    );
}
