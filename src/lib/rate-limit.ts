import "server-only";
import { and, eq, lt, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { rateLimits } from "@/lib/db/schema";

export const RATE_LIMIT = { requests: 10, windowSeconds: 60 } as const;

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSeconds: number };

/** Fixed-window limiter backed by Postgres (works across serverless instances). */
export async function checkRateLimit(
  userId: string,
  now: Date = new Date(),
): Promise<RateLimitResult> {
  const windowMs = RATE_LIMIT.windowSeconds * 1000;
  const windowStart = new Date(Math.floor(now.getTime() / windowMs) * windowMs);
  const db = getDb();

  const [row] = await db
    .insert(rateLimits)
    .values({ userId, windowStart, count: 1 })
    .onConflictDoUpdate({
      target: [rateLimits.userId, rateLimits.windowStart],
      set: { count: sql`${rateLimits.count} + 1` },
    })
    .returning({ count: rateLimits.count });

  const count = row?.count ?? 1;
  if (count === 1) {
    // First request in a new window: prune this user's stale windows.
    await db
      .delete(rateLimits)
      .where(and(eq(rateLimits.userId, userId), lt(rateLimits.windowStart, windowStart)));
  }

  if (count > RATE_LIMIT.requests) {
    const retryAfterSeconds = Math.ceil((windowStart.getTime() + windowMs - now.getTime()) / 1000);
    return { ok: false, retryAfterSeconds: Math.max(1, retryAfterSeconds) };
  }
  return { ok: true };
}
