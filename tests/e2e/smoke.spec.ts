import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

test.skip(!process.env.TEST_DATABASE_URL, "Set TEST_DATABASE_URL to run the end-to-end smoke test");

/** Wait until React has swapped streamed Suspense content into place. */
async function settled(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.waitForFunction(() => !document.querySelector('div[hidden][id^="S:"]'));
}

async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const serious = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  expect(serious.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
}

test("sign up → generate → hit trial limit → paywall", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("AI content studio");
  await expectAccessible(page);

  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();

  // Sign up (test-only sign-in; the real flow is Supabase magic link / Google).
  const res = await page.request.post("/api/e2e/signup", {
    data: { email: `e2e-${Date.now()}@test.dev` },
  });
  expect(res.ok()).toBe(true);

  await page.goto("/onboarding");
  await settled(page);
  await expect(page.getByRole("heading", { name: "Set up your brand voice" })).toBeVisible();
  await page.getByRole("button", { name: "Skip for now" }).click();
  await page.waitForURL("**/ideas");
  await settled(page);
  await expect(page.getByText("0/5")).toBeVisible();
  await expectAccessible(page);

  await page.getByLabel("Niche", { exact: true }).fill("Home fitness");
  await page.getByLabel("Audience", { exact: true }).fill("Busy moms");
  for (let i = 1; i <= 5; i++) {
    await page.getByRole("button", { name: "Generate 10 ideas" }).click();
    await expect(page.getByRole("heading", { name: /Sample idea 10/ })).toBeVisible();
    await expect(page.getByText(`${i}/5`)).toBeVisible();
  }

  await page.getByRole("button", { name: "Generate 10 ideas" }).click();
  const paywall = page.getByRole("dialog");
  await expect(
    paywall.getByRole("heading", { name: "You've used your free generations" }),
  ).toBeVisible();
  await expect(paywall.getByRole("button", { name: /Subscribe for \$5\/month/ })).toBeVisible();
  // The form input is kept for after subscribing.
  await expect(page.getByLabel("Niche", { exact: true })).toHaveValue("Home fitness");
});

test("the test-only signup endpoint validates its input", async ({ request }) => {
  // It's enabled on this dev server; production builds always answer 404 (see tests/unit/e2e-guard.test.ts).
  const res = await request.post("/api/e2e/signup", { data: { email: "not-an-email" } });
  expect(res.status()).toBe(400);
});
