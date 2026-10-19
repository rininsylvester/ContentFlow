import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  formatMonth,
  isISODate,
  monthGrid,
  sameMonth,
  startOfWeek,
  todayISO,
  weekDays,
} from "@/lib/calendar/dates";
import { libraryHref, parseLibraryParams } from "@/lib/library/filters";
import { savedItemPreview, savedItemSwatches, savedItemToText } from "@/lib/library/format";

describe("calendar dates", () => {
  it("validates real calendar dates only", () => {
    expect(isISODate("2026-10-19")).toBe(true);
    expect(isISODate("2026-02-30")).toBe(false);
    expect(isISODate("2026-1-5")).toBe(false);
    expect(isISODate("garbage")).toBe(false);
  });

  it("does date math across month and year boundaries", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2024-03-01", -1)).toBe("2024-02-29");
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-01");
    expect(addMonths("2026-01-15", -1)).toBe("2025-12-01");
  });

  it("starts weeks on Monday", () => {
    expect(startOfWeek("2026-10-19")).toBe("2026-10-19"); // Monday
    expect(startOfWeek("2026-10-25")).toBe("2026-10-19"); // Sunday
    expect(weekDays("2026-10-22")).toEqual([
      "2026-10-19",
      "2026-10-20",
      "2026-10-21",
      "2026-10-22",
      "2026-10-23",
      "2026-10-24",
      "2026-10-25",
    ]);
  });

  it("builds a 6-week month grid that contains the whole month", () => {
    const grid = monthGrid("2026-02-14");
    expect(grid).toHaveLength(42);
    expect(grid[0]).toBe("2026-01-26");
    expect(grid).toContain("2026-02-01");
    expect(grid).toContain("2026-02-28");
    expect(sameMonth("2026-02-01", "2026-02-28")).toBe(true);
  });

  it("formats and reads today in local time", () => {
    expect(formatMonth("2026-10-01")).toBe("October 2026");
    expect(todayISO(new Date(2026, 9, 5, 23, 59))).toBe("2026-10-05");
  });
});

describe("library filters", () => {
  it("parses valid params and ignores invalid ones", () => {
    expect(
      parseLibraryParams({ q: " espresso ", tool: "seo", tag: "Launch", fav: "1", limit: "48" }),
    ).toEqual({
      q: "espresso",
      tool: "seo",
      tag: "launch",
      favorites: true,
      limit: 48,
    });
    expect(parseLibraryParams({ tool: "evil", fav: "yes", limit: "99999" })).toEqual({
      q: undefined,
      tool: undefined,
      tag: undefined,
      favorites: false,
      limit: 24,
    });
  });

  it("builds clean hrefs", () => {
    expect(libraryHref({})).toBe("/library");
    expect(libraryHref({ q: "a b", favorites: true, limit: 24 })).toBe("/library?q=a+b&fav=1");
  });
});

describe("saved item formatting", () => {
  it("formats ideas with their expansion", () => {
    const text = savedItemToText("ideas", {
      idea: {
        title: "Morning routine",
        hook: "Stop this",
        angle: "Real time",
        whyItWorks: "Proof",
        difficulty: "easy",
      },
      expansion: {
        summary: "A brief",
        outline: ["One", "Two", "Three"],
        keyPoints: ["K"],
        cta: "Follow",
      },
    });
    expect(text).toContain("Morning routine");
    expect(text).toContain("Hook: Stop this");
    expect(text).toContain("1. One");
    expect(text).toContain("CTA: Follow");
  });

  it("is robust to malformed content", () => {
    expect(() => savedItemToText("script", null)).not.toThrow();
    expect(() => savedItemToText("aesthetics", { palette: "nope" })).not.toThrow();
    expect(savedItemPreview("hooks", { hooks: [] })).toBe("");
  });

  it("previews, truncates and extracts only valid swatches", () => {
    expect(savedItemPreview("seo", { optimizedTitle: "x".repeat(200) }, 20)).toHaveLength(20);
    expect(
      savedItemSwatches("aesthetics", {
        palette: [{ hex: "#112233" }, { hex: "red" }, { hex: "url(x)" }],
      }),
    ).toEqual(["#112233"]);
    expect(savedItemSwatches("ideas", {})).toEqual([]);
  });

  it("labels SEO as AI-suggested in exports", () => {
    expect(savedItemToText("seo", { primaryKeyword: "k" })).toContain("AI-suggested");
  });
});
