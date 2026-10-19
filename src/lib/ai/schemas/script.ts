import { z } from "zod";
import {
  SCRIPT_FORMAT_LABELS,
  SCRIPT_FORMATS,
  SCRIPT_LENGTH_LABELS,
  SCRIPT_LENGTHS,
} from "../options";
import { optionalText, platformSchema, text } from "./common";

export { SCRIPT_FORMAT_LABELS, SCRIPT_FORMATS, SCRIPT_LENGTH_LABELS, SCRIPT_LENGTHS };

export const scriptInputSchema = z.object({
  topic: text(3, 1500),
  platform: platformSchema,
  format: z.enum(SCRIPT_FORMATS),
  length: z.enum(SCRIPT_LENGTHS),
  tone: text(2, 60),
  cta: optionalText(200),
});
export type ScriptInput = z.infer<typeof scriptInputSchema>;

export const scriptSectionSchema = z.object({
  heading: z.string(),
  timestamp: z.string(),
  script: z.string(),
  bRoll: z.array(z.string()),
  onScreenText: z.array(z.string()),
});
export type ScriptSection = z.infer<typeof scriptSectionSchema>;

export const scriptOutputSchema = z.object({
  title: z.string(),
  hooks: z.array(z.object({ text: z.string(), style: z.string() })).min(1),
  sections: z.array(scriptSectionSchema).min(1),
  cta: z.string(),
  estimatedDuration: z.string(),
});
export type ScriptOutput = z.infer<typeof scriptOutputSchema>;

export const scriptSectionInputSchema = z.object({
  script: scriptInputSchema,
  title: text(1, 300),
  outline: z.array(text(1, 300)).min(1).max(40),
  sectionIndex: z.number().int().min(0).max(39),
  section: z.object({
    heading: text(1, 300),
    timestamp: z.string().trim().max(40),
    script: z.string().trim().max(6000),
    bRoll: z.array(z.string().trim().max(500)).max(20),
    onScreenText: z.array(z.string().trim().max(300)).max(20),
  }),
  instruction: optionalText(300),
});
export type ScriptSectionInput = z.infer<typeof scriptSectionInputSchema>;
