import { describe, expect, it } from "vitest";
import { hasActiveSubscription, summarizeUsage } from "@/lib/billing/usage-summary";

const now = new Date("2026-10-19T12:00:00Z");
const future = new Date("2026-11-01T00:00:00Z");
const past = new Date("2026-10-01T00:00:00Z");

describe("hasActiveSubscription", () => {
  it("grants access for active and past_due", () => {
    expect(hasActiveSubscription("active", future, now)).toBe(true);
    expect(hasActiveSubscription("past_due", future, now)).toBe(true);
  });

  it("keeps canceled subscriptions active until the period ends", () => {
    expect(hasActiveSubscription("canceled", future, now)).toBe(true);
    expect(hasActiveSubscription("canceled", past, now)).toBe(false);
    expect(hasActiveSubscription("canceled", null, now)).toBe(false);
  });

  it("denies none, unpaid and incomplete", () => {
    for (const s of ["none", "unpaid", "incomplete"] as const) {
      expect(hasActiveSubscription(s, future, now)).toBe(false);
    }
  });
});

describe("summarizeUsage", () => {
  it("reports trial usage for non-subscribers", () => {
    const summary = summarizeUsage(
      { subscriptionStatus: "none", currentPeriodEnd: null, trialGenerationsUsed: 3 },
      null,
      now,
    );
    expect(summary).toEqual({ kind: "trial", used: 3, limit: 5, remaining: 2 });
  });

  it("never reports negative remaining", () => {
    const summary = summarizeUsage(
      { subscriptionStatus: "none", currentPeriodEnd: null, trialGenerationsUsed: 9 },
      null,
      now,
    );
    expect(summary.remaining).toBe(0);
  });

  it("reports the monthly cap for subscribers", () => {
    const summary = summarizeUsage(
      { subscriptionStatus: "active", currentPeriodEnd: future, trialGenerationsUsed: 5 },
      120,
      now,
    );
    expect(summary).toMatchObject({ kind: "subscription", used: 120, limit: 400, remaining: 280 });
  });

  it("treats a missing usage period as zero used", () => {
    const summary = summarizeUsage(
      { subscriptionStatus: "active", currentPeriodEnd: future, trialGenerationsUsed: 0 },
      null,
      now,
    );
    expect(summary.used).toBe(0);
  });
});
