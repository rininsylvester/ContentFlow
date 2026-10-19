import type { IdeaExpandInput } from "../../schemas/ideas";
import { field, SHARED_RULES, type PromptTemplate } from "../types";

export const ideasExpandV1: PromptTemplate<IdeaExpandInput> = {
  version: "ideas-expand@v1",
  maxTokens: 2500,
  timeoutMs: 40_000,
  system: `You are a senior content strategist. Expand a single content idea into a production-ready brief.

Provide:
- summary: two or three sentences describing the finished piece
- outline: the beats of the piece in order, one line each (4 to 8 beats)
- keyPoints: the essential points the audience must take away
- examples: concrete examples, stories, data points or demonstrations to include
- cta: a natural call to action that fits the creator's goal

${SHARED_RULES}`,
  buildUser: ({ idea, context }) =>
    [
      "Expand this idea into a brief.",
      field("idea_title", idea.title),
      field("idea_angle", idea.angle),
      field("idea_hook", idea.hook),
      field("why_it_works", idea.whyItWorks),
      field("niche", context.niche),
      field("platform", context.platform),
      field("audience", context.audience),
      field("goal", context.goal),
    ]
      .filter(Boolean)
      .join("\n"),
};
