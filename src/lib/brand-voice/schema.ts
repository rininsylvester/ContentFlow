import { z } from "zod";
import { PLATFORMS } from "@/lib/ai/options";

export const BRAND_VOICE_LIMITS = {
  niche: 120,
  audience: 200,
  tone: 120,
  words: 20,
  wordLength: 40,
  example: 4000,
} as const;

const words = z
  .array(z.string().trim().min(1).max(BRAND_VOICE_LIMITS.wordLength))
  .max(BRAND_VOICE_LIMITS.words)
  .transform((list) => [...new Set(list)]);

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v ? v : null));

export const brandVoiceSchema = z.object({
  niche: optional(BRAND_VOICE_LIMITS.niche),
  audience: optional(BRAND_VOICE_LIMITS.audience),
  tone: optional(BRAND_VOICE_LIMITS.tone),
  wordsToUse: words,
  wordsToAvoid: words,
  exampleContent: optional(BRAND_VOICE_LIMITS.example),
  platforms: z
    .array(z.enum(PLATFORMS))
    .max(PLATFORMS.length)
    .transform((list) => [...new Set(list)]),
});

export type BrandVoiceInput = z.input<typeof brandVoiceSchema>;
export type BrandVoiceValues = z.output<typeof brandVoiceSchema>;

export const EMPTY_BRAND_VOICE: BrandVoiceInput = {
  niche: "",
  audience: "",
  tone: "",
  wordsToUse: [],
  wordsToAvoid: [],
  exampleContent: "",
  platforms: [],
};
