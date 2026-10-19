import { z } from "zod";
import { text } from "./common";

export const repurposeInputSchema = z.object({
  source: text(50, 20_000),
});
export type RepurposeInput = z.infer<typeof repurposeInputSchema>;

export const repurposeOutputSchema = z.object({
  shortCaption: z.string(),
  youtubeDescription: z.string(),
  thread: z.array(z.string()).min(2),
  linkedinPost: z.string(),
  newsletterBlurb: z.string(),
});
export type RepurposeOutput = z.infer<typeof repurposeOutputSchema>;
