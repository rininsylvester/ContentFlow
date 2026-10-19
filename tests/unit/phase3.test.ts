import { describe, expect, it, vi } from "vitest";
import { aestheticsOutputSchema } from "@/lib/ai/schemas/aesthetics";
import { hooksOutputSchema } from "@/lib/ai/schemas/hooks";
import type { SeoOutput } from "@/lib/ai/schemas/seo";
import { contrastRatio, parseHex, readableTextColor } from "@/lib/color";
import { fontStack, googleFontHref, safeFontFamily } from "@/lib/fonts";
import { aiSuggestedProvider, enrichSeo, type KeywordProvider } from "@/lib/seo/keyword-provider";

const seo: SeoOutput = {
  primaryKeyword: "espresso",
  searchIntent: "informational",
  secondaryKeywords: ["a", "b", "c"],
  longTailKeywords: ["d", "e", "f"],
  optimizedTitle: "T",
  description: "D",
  tags: ["x", "y", "z"],
  hashtags: { broad: ["#a"], niche: ["#b"] },
};

describe("enrichSeo", () => {
  it("labels output as AI-suggested by default", async () => {
    const result = await enrichSeo(seo, { topic: "espresso", platform: "YouTube" });
    expect(result.keywordData).toEqual({
      source: "ai",
      label: aiSuggestedProvider.label,
      metrics: {},
    });
    expect(result.primaryKeyword).toBe("espresso");
  });

  it("attaches metrics from a pluggable provider", async () => {
    const provider: KeywordProvider = {
      id: "test",
      label: "Test data",
      lookup: vi.fn(async (keywords: string[]) =>
        Object.fromEntries(keywords.map((k) => [k, { volume: 100, difficulty: 20 }])),
      ),
    };
    const result = await enrichSeo(seo, { topic: "espresso", platform: "YouTube" }, provider);
    expect(provider.lookup).toHaveBeenCalledWith(
      ["espresso", "a", "b", "c", "d", "e", "f"],
      "YouTube",
    );
    expect(result.keywordData.metrics.espresso).toEqual({ volume: 100, difficulty: 20 });
  });

  it("never fails the generation when the provider throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const provider: KeywordProvider = {
      id: "broken",
      label: "Broken",
      lookup: async () => {
        throw new Error("API down");
      },
    };
    const result = await enrichSeo(seo, { topic: "espresso", platform: "YouTube" }, provider);
    expect(result.keywordData).toMatchObject({ source: "broken", metrics: {} });
  });
});

describe("fonts", () => {
  it("accepts real Google Fonts family names", () => {
    expect(safeFontFamily("Playfair Display")).toBe("Playfair Display");
    expect(safeFontFamily("  Inter  ")).toBe("Inter");
    expect(googleFontHref("DM Serif Display")).toBe(
      "https://fonts.googleapis.com/css2?family=DM+Serif+Display&display=swap",
    );
  });

  it.each(['Inter"; } body { display:none', "x&family=Evil", "<script>", "", "a".repeat(80)])(
    "rejects unsafe name %s",
    (name) => {
      expect(safeFontFamily(name)).toBeNull();
      expect(googleFontHref(name)).toBeNull();
      expect(fontStack(name)).toBe("sans-serif");
    },
  );
});

describe("color", () => {
  it("parses hex and computes WCAG contrast", () => {
    expect(parseHex("#FFFFFF")).toEqual([255, 255, 255]);
    expect(parseHex("fff")).toBeNull();
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 0);
  });

  it("picks readable text for a swatch", () => {
    expect(readableTextColor("#F4EDE4")).toBe("#000000");
    expect(readableTextColor("#1F1A17")).toBe("#FFFFFF");
  });
});

describe("phase 3 output schemas", () => {
  it("rejects invalid hex colors in a palette", () => {
    const base = {
      fontPairings: [
        { heading: "A", body: "B", why: "" },
        { heading: "C", body: "D", why: "" },
      ],
      visualStyle: "",
      lighting: ["x"],
      camera: ["y"],
      thumbnails: [
        { concept: "", layout: "", text: "", expression: "", contrast: "" },
        { concept: "", layout: "", text: "", expression: "", contrast: "" },
      ],
      shotList: Array(4).fill({ shot: "s", purpose: "p" }),
    };
    const palette = (hex: string) => Array(5).fill({ hex, name: "n", role: "r" });
    expect(aestheticsOutputSchema.safeParse({ ...base, palette: palette("#A1B2C3") }).success).toBe(
      true,
    );
    expect(aestheticsOutputSchema.safeParse({ ...base, palette: palette("red") }).success).toBe(
      false,
    );
    expect(aestheticsOutputSchema.safeParse({ ...base, palette: palette("url(x)") }).success).toBe(
      false,
    );
  });

  it("rejects hook scores outside 1-10 and unknown frameworks", () => {
    const hook = { text: "t", framework: "story", reason: "r", score: 7 };
    expect(hooksOutputSchema.safeParse({ hooks: Array(15).fill(hook) }).success).toBe(true);
    expect(
      hooksOutputSchema.safeParse({ hooks: Array(15).fill({ ...hook, score: 11 }) }).success,
    ).toBe(false);
    expect(
      hooksOutputSchema.safeParse({ hooks: Array(15).fill({ ...hook, framework: "meme" }) })
        .success,
    ).toBe(false);
  });
});
