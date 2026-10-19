import { defineConfig, devices } from "@playwright/test";

/**
 * Smoke test: sign up → generate → hit the trial limit → paywall.
 *
 * Runs the dev server with E2E_AUTH=1 (test-only sign-in, dev builds only) and
 * AI_MOCK=1 (no Anthropic calls) against TEST_DATABASE_URL, a Postgres with the
 * migrations applied (see README → Testing).
 */
const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `pnpm exec next dev -p ${PORT}`,
    url: baseURL,
    timeout: 120_000,
    reuseExistingServer: false,
    env: {
      E2E_AUTH: "1",
      AI_MOCK: "1",
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? "",
      NEXT_PUBLIC_SITE_URL: baseURL,
      NEXT_PUBLIC_SUPABASE_URL:
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://e2e.supabase.invalid",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_e2e",
    },
  },
});
