import { describe, expect, it } from "vitest";
import { buildBrandVoiceBlock } from "@/lib/ai/brand-voice";
import { profileToInput } from "@/lib/brand-voice/from-profile";
import { brandVoiceSchema, EMPTY_BRAND_VOICE } from "@/lib/brand-voice/schema";

describe("brandVoiceSchema", () => {
  it("trims text, turns empty strings into null and dedupes lists", () => {
    const parsed = brandVoiceSchema.parse({
      ...EMPTY_BRAND_VOICE,
      niche: "  cooking  ",
      wordsToUse: ["yum", "yum", "tasty"],
      platforms: ["TikTok", "TikTok"],
    });
    expect(parsed).toMatchObject({
      niche: "cooking",
      audience: null,
      tone: null,
      exampleContent: null,
      wordsToUse: ["yum", "tasty"],
      platforms: ["TikTok"],
    });
  });

  it("rejects oversized fields, too many words and unknown platforms", () => {
    expect(
      brandVoiceSchema.safeParse({ ...EMPTY_BRAND_VOICE, niche: "x".repeat(121) }).success,
    ).toBe(false);
    expect(
      brandVoiceSchema.safeParse({
        ...EMPTY_BRAND_VOICE,
        wordsToAvoid: Array.from({ length: 21 }, (_, i) => `w${i}`),
      }).success,
    ).toBe(false);
    expect(
      brandVoiceSchema.safeParse({ ...EMPTY_BRAND_VOICE, platforms: ["MySpace"] }).success,
    ).toBe(false);
  });

  it("an empty profile produces no prompt block", () => {
    const values = brandVoiceSchema.parse(EMPTY_BRAND_VOICE);
    expect(buildBrandVoiceBlock(values)).toBeNull();
  });
});

describe("profileToInput", () => {
  it("returns empty values when there's no profile", () => {
    expect(profileToInput(undefined)).toEqual(EMPTY_BRAND_VOICE);
  });

  it("maps nulls to empty strings and drops unknown platforms", () => {
    const now = new Date();
    const input = profileToInput({
      userId: "u",
      niche: "Fitness",
      audience: null,
      tone: null,
      wordsToUse: ["strong"],
      wordsToAvoid: [],
      exampleContent: null,
      platforms: ["TikTok", "Vine"],
      createdAt: now,
      updatedAt: now,
    });
    expect(input).toEqual({
      ...EMPTY_BRAND_VOICE,
      niche: "Fitness",
      wordsToUse: ["strong"],
      platforms: ["TikTok"],
    });
  });
});
