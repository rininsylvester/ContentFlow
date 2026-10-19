import type { RepurposeInput } from "../../schemas/repurpose";
import { field, SHARED_RULES, type PromptTemplate } from "../types";

export const repurposeV1: PromptTemplate<RepurposeInput> = {
  version: "repurpose@v1",
  maxTokens: 5000,
  timeoutMs: 60_000,
  system: `You are a content repurposing expert. Turn one piece of source content into native versions for other platforms. Keep the creator's key message and voice; adapt structure, length and style to each platform. Do not invent facts that are not in the source.

Provide:
- shortCaption: a TikTok / Instagram Reels caption: hook first line, 1-3 short lines, a call to action and 3-5 relevant hashtags
- youtubeDescription: a YouTube description: a hook line, a 2-3 sentence summary, key takeaways as short lines, and a call to action
- thread: an X / Threads thread of 4 to 8 posts, each under 280 characters; the first post must hook, the last should invite engagement
- linkedinPost: a LinkedIn post with a strong first line, short paragraphs and a question at the end
- newsletterBlurb: a 60-120 word newsletter blurb that makes readers want to click through

${SHARED_RULES}`,
  buildUser: (input) =>
    ["Repurpose this content.", field("source_content", input.source)].join("\n"),
};
