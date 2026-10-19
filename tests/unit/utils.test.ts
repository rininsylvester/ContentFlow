import { describe, expect, it } from "vitest";
import { isAppPath } from "@/lib/routes";
import { safeNextPath } from "@/lib/utils";

describe("safeNextPath", () => {
  it("keeps same-origin relative paths", () => {
    expect(safeNextPath("/scripts?id=1")).toBe("/scripts?id=1");
  });

  it.each([
    null,
    undefined,
    "",
    "https://evil.com",
    "//evil.com",
    "/\\evil.com",
    "javascript:alert(1)",
  ])("falls back for unsafe value %s", (value) => {
    expect(safeNextPath(value)).toBe("/ideas");
  });
});

describe("isAppPath", () => {
  it("matches protected prefixes exactly or as a segment", () => {
    expect(isAppPath("/ideas")).toBe(true);
    expect(isAppPath("/settings/billing")).toBe(true);
    expect(isAppPath("/ideasfoo")).toBe(false);
    expect(isAppPath("/")).toBe(false);
    expect(isAppPath("/login")).toBe(false);
  });
});
