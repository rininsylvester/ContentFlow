import { describe, expect, it } from "vitest";
import { buildBrandVoiceBlock, type BrandVoice } from "@/lib/ai/brand-voice";
import { estimateCostMicros } from "@/lib/ai/cost";
import { MODEL_FOR_TASK, MODELS, TASK_IDS } from "@/lib/ai/models";
import { ideasInputSchema } from "@/lib/ai/schemas/ideas";
import { planForUser } from "@/lib/billing/entitlements";

describe("model config", () => {
  it("routes every task to the cheapest model (Haiku 5.5)", () => {
    for (const id of TASK_IDS) expect(MODELS[MODEL_FOR_TASK[id]].id).toBe("claude-haiku-5-5");
  });
});

describe("estimateCostMicros", () => {
  it("prices Haiku 5.5 at $0.10 / $0.50 per million tokens", () => {
    // 1,000 in * 0.1 + 2,000 out * 0.5 = 1,100 micro-dollars
    expect(estimateCostMicros(MODELS.haiku, { inputTokens: 1000, outputTokens: 2000 })).toBe(1100);
  });

  it("rounds up fractional micro-dollars", () => {
    expect(estimateCostMicros(MODELS.haiku, { inputTokens: 1, outputTokens: 0 })).toBe(1);
  });

  it("uses long-context rates above the threshold", () => {
    expect(estimateCostMicros(MODELS.haiku, { inputTokens: 200_000, outputTokens: 0 })).toBe(
      100_000,
    );
  });
});

describe("buildBrandVoiceBlock", () => {
  const empty: BrandVoice = {
    niche: null,
    audience: null,
    tone: null,
    wordsToUse: [],
    wordsToAvoid: [],
    exampleContent: null,
    platforms: [],
  };

  it("returns null for missing or empty profiles", () => {
    expect(buildBrandVoiceBlock(null)).toBeNull();
    expect(buildBrandVoiceBlock(empty)).toBeNull();
  });

  it("includes only filled fields inside a brand_voice tag", () => {
    const block = buildBrandVoiceBlock({ ...empty, tone: "playful", wordsToAvoid: ["hustle"] });
    expect(block).toContain("<brand_voice>");
    expect(block).toContain("Tone: playful");
    expect(block).toContain("Words and phrases to avoid: hustle");
    expect(block).not.toContain("Niche:");
  });

  it("truncates long example content", () => {
    const block = buildBrandVoiceBlock({ ...empty, exampleContent: "x".repeat(5000) });
    expect(block!.length).toBeLessThan(2600);
  });
});

describe("input validation", () => {
  it("trims and bounds free text, dropping an empty optional topic", () => {
    const parsed = ideasInputSchema.parse({
      niche: "  fitness  ",
      platform: "TikTok",
      audience: "busy moms",
      goal: "grow",
      topic: "   ",
    });
    expect(parsed).toEqual({
      niche: "fitness",
      platform: "TikTok",
      audience: "busy moms",
      goal: "grow",
    });
  });

  it("rejects unknown platforms and oversized input", () => {
    expect(
      ideasInputSchema.safeParse({
        niche: "x".repeat(500),
        platform: "TikTok",
        audience: "a",
        goal: "grow",
      }).success,
    ).toBe(false);
    expect(
      ideasInputSchema.safeParse({
        niche: "fit",
        platform: "MySpace",
        audience: "moms",
        goal: "grow",
      }).success,
    ).toBe(false);
  });
});

describe("planForUser", () => {
  const now = new Date("2026-10-19T00:00:00Z");

  it("charges non-subscribers against the trial", () => {
    expect(
      planForUser(
        { subscriptionStatus: "none", currentPeriodStart: null, currentPeriodEnd: null },
        now,
      ),
    ).toEqual({ kind: "trial", limit: 5 });
  });

  it("charges subscribers against their billing period", () => {
    const start = new Date("2026-10-05T00:00:00Z");
    const end = new Date("2026-11-05T00:00:00Z");
    expect(
      planForUser(
        { subscriptionStatus: "active", currentPeriodStart: start, currentPeriodEnd: end },
        now,
      ),
    ).toEqual({ kind: "subscription", periodStart: start, periodEnd: end, cap: 400 });
  });

  it("falls back to the calendar month when period dates are missing", () => {
    const plan = planForUser(
      { subscriptionStatus: "active", currentPeriodStart: null, currentPeriodEnd: null },
      now,
    );
    expect(plan).toMatchObject({
      kind: "subscription",
      periodStart: new Date("2026-10-01T00:00:00Z"),
      periodEnd: new Date("2026-11-01T00:00:00Z"),
    });
  });

  it("treats an expired canceled subscription as trial", () => {
    expect(
      planForUser(
        {
          subscriptionStatus: "canceled",
          currentPeriodStart: new Date("2026-09-01T00:00:00Z"),
          currentPeriodEnd: new Date("2026-10-01T00:00:00Z"),
        },
        now,
      ).kind,
    ).toBe("trial");
  });
});
