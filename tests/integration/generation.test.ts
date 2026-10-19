import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { AiError } from "@/lib/ai/errors";
import type { StreamEvent } from "@/lib/ai/protocol";
import { startGeneration } from "@/lib/ai/run";
import { TASKS } from "@/lib/ai/tasks";
import { reserveGeneration } from "@/lib/db/queries/billing";
import { getDb } from "@/lib/db/client";
import { checkRateLimit } from "@/lib/rate-limit";
import { generations, usagePeriods, users } from "@/lib/db/schema";

const enabled = Boolean(process.env.DATABASE_URL);

const ideasInput = {
  niche: "Home fitness",
  platform: "TikTok",
  audience: "Busy moms",
  goal: "grow",
} as const;

async function createUser(): Promise<string> {
  const id = randomUUID();
  await getDb().execute(
    sql`insert into auth.users (id, email) values (${id}, ${`${id}@test.dev`})`,
  );
  return id;
}

async function readEvents(stream: ReadableStream<Uint8Array>): Promise<StreamEvent[]> {
  const text = await new Response(stream).text();
  return text
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as StreamEvent);
}

function generate(userId: string) {
  return startGeneration({
    userId,
    task: TASKS.ideas,
    input: ideasInput,
    useBrandVoice: true,
    signal: new AbortController().signal,
  });
}

async function trialUsed(userId: string) {
  const [row] = await getDb().select().from(users).where(eq(users.id, userId));
  return row?.trialGenerationsUsed;
}

describe.skipIf(!enabled)("generation pipeline (integration)", () => {
  let userId: string;

  beforeEach(async () => {
    userId = await createUser();
  });

  afterEach(() => {
    delete process.env.AI_MOCK_SCENARIO;
  });

  afterAll(async () => {
    await getDb().execute(sql`delete from auth.users where email like '%@test.dev'`);
  });

  it("streams a successful generation and records it", async () => {
    const events = await readEvents(await generate(userId));
    expect(events[0]?.type).toBe("start");
    expect(events.some((e) => e.type === "delta")).toBe(true);
    const done = events.at(-1);
    expect(done?.type).toBe("done");
    if (done?.type !== "done") return;

    expect(done.usage).toMatchObject({ kind: "trial", used: 1, remaining: 4 });
    const [row] = await getDb()
      .select()
      .from(generations)
      .where(eq(generations.id, done.generationId));
    expect(row).toMatchObject({
      status: "succeeded",
      tool: "ideas",
      model: "claude-haiku-5-5",
      promptVersion: "ideas@v1",
      billedAs: "trial",
    });
    expect(row?.outputTokens).toBeGreaterThan(0);
    expect(row?.costUsdMicros).toBeGreaterThan(0);
    expect(row?.input).toEqual(ideasInput);
  });

  it("blocks the 6th trial generation with trial_exhausted", async () => {
    for (let i = 0; i < 5; i++) await readEvents(await generate(userId));
    expect(await trialUsed(userId)).toBe(5);

    await expect(generate(userId)).rejects.toMatchObject({ code: "trial_exhausted", status: 402 });
    expect(await trialUsed(userId)).toBe(5);
  });

  it("refunds the generation and keeps the input when output is invalid after a retry", async () => {
    process.env.AI_MOCK_SCENARIO = "invalid";
    const events = await readEvents(await generate(userId));
    expect(events.filter((e) => e.type === "reset")).toHaveLength(1);
    expect(events.at(-1)).toMatchObject({ type: "error", code: "invalid_output" });
    expect(await trialUsed(userId)).toBe(0);

    const [row] = await getDb().select().from(generations).where(eq(generations.userId, userId));
    expect(row).toMatchObject({ status: "failed", errorCode: "invalid_output", billedAs: "none" });
    expect(row?.input).toEqual(ideasInput);
  });

  it("refunds on provider errors", async () => {
    process.env.AI_MOCK_SCENARIO = "error";
    const events = await readEvents(await generate(userId));
    expect(events.at(-1)).toMatchObject({ type: "error", code: "provider_error" });
    expect(await trialUsed(userId)).toBe(0);
  });

  it("never exceeds the trial allowance under concurrent requests", async () => {
    const results = await Promise.all(
      Array.from({ length: 12 }, () => reserveGeneration(userId, { kind: "trial", limit: 5 })),
    );
    expect(results.filter((r) => r.ok)).toHaveLength(5);
    expect(await trialUsed(userId)).toBe(5);
  });

  it("enforces the subscriber cap per billing period", async () => {
    const periodStart = new Date("2026-10-05T00:00:00Z");
    const periodEnd = new Date("2099-11-05T00:00:00Z");
    await getDb()
      .update(users)
      .set({
        subscriptionStatus: "active",
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      })
      .where(eq(users.id, userId));
    await getDb()
      .insert(usagePeriods)
      .values({ userId, periodStart, periodEnd, generationCap: 400, generationsUsed: 399 });

    const events = await readEvents(await generate(userId));
    expect(events.at(-1)).toMatchObject({
      type: "done",
      usage: { kind: "subscription", used: 400, remaining: 0 },
    });
    await expect(generate(userId)).rejects.toMatchObject({ code: "cap_reached" });
    expect(await trialUsed(userId)).toBe(0);

    const [period] = await getDb()
      .select()
      .from(usagePeriods)
      .where(eq(usagePeriods.userId, userId));
    expect(period?.outputTokens).toBeGreaterThan(0);
  });

  it("rate limits after 10 requests per minute without consuming generations", async () => {
    // Avoid straddling a window boundary.
    const msIntoWindow = Date.now() % 60_000;
    if (msIntoWindow > 57_000) await new Promise((r) => setTimeout(r, 60_000 - msIntoWindow + 50));
    for (let i = 0; i < 10; i++) expect(await checkRateLimit(userId)).toEqual({ ok: true });

    const error = await generate(userId).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AiError);
    expect(error).toMatchObject({ code: "rate_limited", status: 429 });
    expect((error as AiError).retryAfterSeconds).toBeGreaterThan(0);
    expect(await trialUsed(userId)).toBe(0);
  });
});
