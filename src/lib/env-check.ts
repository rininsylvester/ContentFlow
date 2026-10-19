/**
 * Production configuration check, run once at server start (see src/instrumentation.ts).
 * Returns human-readable problems; an empty list means the deployment is fully configured.
 */
export function productionConfigProblems(env: Record<string, string | undefined>): string[] {
  const problems: string[] = [];
  const required: Record<string, string> = {
    NEXT_PUBLIC_SITE_URL: "public URL of the app",
    NEXT_PUBLIC_SUPABASE_URL: "Supabase project URL",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "Supabase publishable key",
    DATABASE_URL: "Supabase Postgres connection string",
    ANTHROPIC_API_KEY: "AI generation",
    STRIPE_SECRET_KEY: "Stripe Checkout and portal",
    STRIPE_WEBHOOK_SECRET: "Stripe webhook verification",
    STRIPE_PRICE_ID: "the $5/month price",
  };
  for (const [key, purpose] of Object.entries(required)) {
    const value = env[key]?.trim();
    if (!value || value.includes("YOUR-") || value.endsWith("_xxx"))
      problems.push(`${key} is not set (${purpose})`);
  }

  const site = env.NEXT_PUBLIC_SITE_URL ?? "";
  if (site && !site.startsWith("https://"))
    problems.push("NEXT_PUBLIC_SITE_URL should be an https:// URL");
  if (site.endsWith("/")) problems.push("NEXT_PUBLIC_SITE_URL must not end with a slash");
  if (env.STRIPE_SECRET_KEY?.startsWith("sk_test_"))
    problems.push("STRIPE_SECRET_KEY is a test-mode key");
  if (env.AI_MOCK === "1")
    problems.push("AI_MOCK=1 is set; it is ignored in production, remove it");
  if (env.E2E_AUTH === "1")
    problems.push("E2E_AUTH=1 is set; it is ignored in production, remove it");
  if (env.DATABASE_URL?.includes(":5432/") && env.DATABASE_URL.includes("pooler.supabase.com")) {
    problems.push(
      "DATABASE_URL uses the session pooler (5432); use the transaction pooler (6543) on Vercel",
    );
  }
  return problems;
}
