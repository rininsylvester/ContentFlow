import "server-only";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { usagePeriods, type User } from "@/lib/db/schema";
import { summarizeUsage, type UsageSummary } from "@/lib/billing/usage-summary";

export async function getUsageSummary(user: User): Promise<UsageSummary> {
  let periodUsed: number | null = null;
  if (user.currentPeriodStart) {
    const [period] = await getDb()
      .select({ used: usagePeriods.generationsUsed })
      .from(usagePeriods)
      .where(
        and(
          eq(usagePeriods.userId, user.id),
          eq(usagePeriods.periodStart, user.currentPeriodStart),
        ),
      )
      .limit(1);
    periodUsed = period?.used ?? null;
  }
  return summarizeUsage(user, periodUsed);
}
