import { z } from "zod";
import { HOOK_FRAMEWORKS } from "../options";
import { optionalText, platformSchema, text } from "./common";

export const hooksInputSchema = z.object({
  topic: text(3, 500),
  platform: platformSchema,
  audience: optionalText(200),
});
export type HooksInput = z.infer<typeof hooksInputSchema>;

export const hookSchema = z.object({
  text: z.string(),
  framework: z.enum(HOOK_FRAMEWORKS),
  reason: z.string(),
  score: z.number().int().min(1).max(10),
});
export type Hook = z.infer<typeof hookSchema>;

export const hooksOutputSchema = z.object({
  hooks: z.array(hookSchema).min(10),
});
export type HooksOutput = z.infer<typeof hooksOutputSchema>;
