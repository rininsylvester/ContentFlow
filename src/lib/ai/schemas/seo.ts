import { z } from "zod";
import { SEARCH_INTENTS } from "../options";
import { platformSchema, text } from "./common";

export const seoInputSchema = z.object({
  topic: text(3, 300),
  platform: platformSchema,
});
export type SeoInput = z.infer<typeof seoInputSchema>;

export const seoOutputSchema = z.object({
  primaryKeyword: z.string(),
  searchIntent: z.enum(SEARCH_INTENTS),
  secondaryKeywords: z.array(z.string()).min(3),
  longTailKeywords: z.array(z.string()).min(3),
  optimizedTitle: z.string(),
  description: z.string(),
  tags: z.array(z.string()).min(3),
  hashtags: z.object({
    broad: z.array(z.string()).min(1),
    niche: z.array(z.string()).min(1),
  }),
});
export type SeoOutput = z.infer<typeof seoOutputSchema>;
