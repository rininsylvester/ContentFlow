/**
 * Test-only sign-in for the Playwright smoke test (no Supabase needed).
 *
 * Enabled only when BOTH NODE_ENV is "development" and E2E_AUTH=1. Production
 * builds hard-code NODE_ENV to "production", so this can never be switched on
 * in a deployed app.
 */
export const E2E_COOKIE = "creatorhub-e2e-user";

export function isE2EAuthEnabled(): boolean {
  return process.env.NODE_ENV === "development" && process.env.E2E_AUTH === "1";
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function e2eUserIdFromCookie(value: string | undefined): string | null {
  return isE2EAuthEnabled() && value && UUID.test(value) ? value : null;
}
