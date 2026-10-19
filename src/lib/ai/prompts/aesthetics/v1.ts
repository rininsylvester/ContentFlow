import type { AestheticsInput } from "../../schemas/aesthetics";
import { field, SHARED_RULES, type PromptTemplate } from "../types";

export const aestheticsV1: PromptTemplate<AestheticsInput> = {
  version: "aesthetics@v1",
  maxTokens: 3500,
  timeoutMs: 45_000,
  system: `You are a creative director who builds visual identities for creators.

Provide:
- palette: exactly 5 colors as 6-digit hex codes (for example #1A2B3C), each with an evocative name and a role (background, primary, accent, text, highlight). Make sure text and background colors have strong contrast.
- fontPairings: 2 or 3 heading and body pairings using only fonts available on Google Fonts (exact family names, for example "Playfair Display" and "Inter"), each with a one-line reason
- visualStyle: a short paragraph describing the overall look, mood and editing style
- lighting: specific lighting setups and notes
- camera: framing, lens and movement notes
- thumbnails: 3 thumbnail concepts, each with layout, the text on the thumbnail (3-5 words), facial expression or subject, and how contrast makes it pop
- shotList: 6 to 10 shots with their purpose

${SHARED_RULES}`,
  buildUser: (input) =>
    [
      "Create a visual direction.",
      field("niche", input.niche),
      field("vibe", input.vibe),
      field("platform", input.platform),
    ]
      .filter(Boolean)
      .join("\n"),
};
