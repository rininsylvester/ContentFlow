import { afterEach, describe, expect, it, vi } from "vitest";
import { isMockMode } from "@/lib/ai/provider";
import { billingStateFromSubscription } from "@/lib/billing/subscription-state";
import { productionConfigProblems } from "@/lib/env-check";
import { subscription } from "../fixtures/stripe";

const good = {
  NEXT_PUBLIC_SITE_URL: "https://creatorhub.app",
  NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_123",
  DATABASE_URL: "postgresql://postgres.abc:pw@aws-0-us-east-1.pooler.supabase.com:6543/postgres",
  ANTHROPIC_API_KEY: "sk-ant-123",
  STRIPE_SECRET_KEY: "sk_live_123",
  STRIPE_WEBHOOK_SECRET: "whsec_123",
  STRIPE_PRICE_ID: "price_123",
};

describe("productionConfigProblems", () => {
  it("passes a complete production config", () => {
    expect(productionConfigProblems(good)).toEqual([]);
  });

  it("flags missing, placeholder and risky values", () => {
    const problems = productionConfigProblems({
      ...good,
      ANTHROPIC_API_KEY: "",
      NEXT_PUBLIC_SUPABASE_URL: "https://YOUR-PROJECT.supabase.co",
      NEXT_PUBLIC_SITE_URL: "http://creatorhub.app/",
      STRIPE_SECRET_KEY: "sk_test_123",
      DATABASE_URL: "postgresql://x@aws-0-us-east-1.pooler.supabase.com:5432/postgres",
      AI_MOCK: "1",
    });
    expect(problems).toEqual(
      expect.arrayContaining([
        "ANTHROPIC_API_KEY is not set (AI generation)",
        "NEXT_PUBLIC_SUPABASE_URL is not set (Supabase project URL)",
        "NEXT_PUBLIC_SITE_URL should be an https:// URL",
        "NEXT_PUBLIC_SITE_URL must not end with a slash",
        "STRIPE_SECRET_KEY is a test-mode key",
        "AI_MOCK=1 is set; it is ignored in production, remove it",
        "DATABASE_URL uses the session pooler (5432); use the transaction pooler (6543) on Vercel",
      ]),
    );
  });
});

describe("AI mock mode", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("can never be enabled in production", () => {
    vi.stubEnv("AI_MOCK", "1");
    vi.stubEnv("NODE_ENV", "production");
    expect(isMockMode()).toBe(false);
    vi.stubEnv("NODE_ENV", "development");
    expect(isMockMode()).toBe(true);
  });
});

describe("Stripe API-version fallback", () => {
  it("reads the period from the subscription itself on older API versions", () => {
    const legacy = subscription({
      items: { object: "list", data: [{}] },
      current_period_start: 1_700_000_000,
      current_period_end: 1_702_592_000,
    } as never);
    const state = billingStateFromSubscription(legacy);
    expect(state.currentPeriodStart).toEqual(new Date(1_700_000_000_000));
    expect(state.currentPeriodEnd).toEqual(new Date(1_702_592_000_000));
  });
});
