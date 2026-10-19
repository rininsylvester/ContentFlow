import type { IdeasInput } from "../../schemas/ideas";
import { field, SHARED_RULES, type PromptTemplate } from "../types";

export const ideasV1: PromptTemplate<IdeasInput> = {
  version: "ideas@v1",
  maxTokens: 4000,
  timeoutMs: 45_000,
  system: `You are a senior content strategist who has helped creators grow channels across YouTube, TikTok, Instagram, podcasts and blogs. You generate content ideas that are specific, timely and built around a strong hook.

For each idea provide:
- title: a punchy working title
- angle: the unique perspective that makes this idea different from what already exists
- hook: the first line or first 3 seconds, written out word for word
- whyItWorks: one or two sentences on the audience psychology or platform mechanic it uses
- difficulty: easy, medium or hard to produce (consider filming, research and editing effort)

Generate exactly 10 ideas with a mix of difficulties and formats.

${SHARED_RULES}`,
  buildUser: (input) =>
    [
      "Generate 10 content ideas.",
      field("niche", input.niche),
      field("platform", input.platform),
      field("audience", input.audience),
      field("goal", input.goal),
      field("trend_or_topic", input.topic),
    ]
      .filter(Boolean)
      .join("\n"),
};
