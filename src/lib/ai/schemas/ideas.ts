import { z } from "zod";
import { DIFFICULTIES, GOALS } from "../options";
import { optionalText, platformSchema, text } from "./common";

export { DIFFICULTIES, GOALS };

export const ideasInputSchema = z.object({
  niche: text(2, 120),
  platform: platformSchema,
  audience: text(2, 200),
  goal: z.enum(GOALS),
  topic: optionalText(200),
});
export type IdeasInput = z.infer<typeof ideasInputSchema>;

export const ideaSchema = z.object({
  title: z.string(),
  angle: z.string(),
  hook: z.string(),
  whyItWorks: z.string(),
  difficulty: z.enum(DIFFICULTIES),
});
export type Idea = z.infer<typeof ideaSchema>;

export const ideasOutputSchema = z.object({
  ideas: z.array(ideaSchema).min(5),
});
export type IdeasOutput = z.infer<typeof ideasOutputSchema>;

export const ideaExpandInputSchema = z.object({
  idea: z.object({
    title: text(1, 300),
    angle: text(1, 1000),
    hook: text(1, 1000),
    whyItWorks: text(1, 1000),
    difficulty: z.enum(DIFFICULTIES),
  }),
  context: ideasInputSchema,
});
export type IdeaExpandInput = z.infer<typeof ideaExpandInputSchema>;

export const ideaExpansionSchema = z.object({
  summary: z.string(),
  outline: z.array(z.string()).min(3),
  keyPoints: z.array(z.string()).min(2),
  examples: z.array(z.string()),
  cta: z.string(),
});
export type IdeaExpansion = z.infer<typeof ideaExpansionSchema>;
