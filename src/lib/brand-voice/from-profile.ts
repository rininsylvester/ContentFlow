import { PLATFORMS, type Platform } from "@/lib/ai/options";
import type { BrandProfile } from "@/lib/db/schema";
import { EMPTY_BRAND_VOICE, type BrandVoiceInput } from "./schema";

/** Database row → form values. */
export function profileToInput(profile: BrandProfile | undefined): BrandVoiceInput {
  if (!profile) return EMPTY_BRAND_VOICE;
  return {
    niche: profile.niche ?? "",
    audience: profile.audience ?? "",
    tone: profile.tone ?? "",
    wordsToUse: profile.wordsToUse,
    wordsToAvoid: profile.wordsToAvoid,
    exampleContent: profile.exampleContent ?? "",
    platforms: profile.platforms.filter((p): p is Platform =>
      (PLATFORMS as readonly string[]).includes(p),
    ),
  };
}
