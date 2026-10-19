import { afterEach, describe, expect, it, vi } from "vitest";
import { e2eUserIdFromCookie, isE2EAuthEnabled } from "@/lib/e2e";

const ID = "11111111-1111-4111-8111-111111111111";

describe("E2E auth guard", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("is off in production even with E2E_AUTH=1", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("E2E_AUTH", "1");
    expect(isE2EAuthEnabled()).toBe(false);
    expect(e2eUserIdFromCookie(ID)).toBeNull();
  });

  it("is off in development unless explicitly enabled", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("E2E_AUTH", "");
    expect(isE2EAuthEnabled()).toBe(false);
  });

  it("accepts only UUID cookies when enabled", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("E2E_AUTH", "1");
    expect(e2eUserIdFromCookie(ID)).toBe(ID);
    expect(e2eUserIdFromCookie("admin")).toBeNull();
    expect(e2eUserIdFromCookie(undefined)).toBeNull();
  });
});
