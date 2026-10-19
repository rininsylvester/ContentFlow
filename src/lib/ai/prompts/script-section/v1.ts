import {
  SCRIPT_FORMAT_LABELS,
  SCRIPT_LENGTH_LABELS,
  type ScriptSectionInput,
} from "../../schemas/script";
import { field, SHARED_RULES, type PromptTemplate } from "../types";

export const scriptSectionV1: PromptTemplate<ScriptSectionInput> = {
  version: "script-section@v1",
  maxTokens: 2500,
  timeoutMs: 40_000,
  system: `You are an expert scriptwriter for creators. Rewrite one section of an existing script so it is stronger, while keeping it consistent with the sections around it: same tone, same approximate length and the same timestamp range unless the request says otherwise.

Return the rewritten section with heading, timestamp, script, bRoll and onScreenText.

${SHARED_RULES}`,
  buildUser: (input) =>
    [
      `Rewrite section ${input.sectionIndex + 1} of ${input.outline.length}.`,
      field("script_title", input.title),
      field("full_outline", input.outline.map((h, i) => `${i + 1}. ${h}`).join("\n")),
      field("topic", input.script.topic),
      field("platform", input.script.platform),
      field("format", SCRIPT_FORMAT_LABELS[input.script.format]),
      field("length", SCRIPT_LENGTH_LABELS[input.script.length]),
      field("tone", input.script.tone),
      field("current_heading", input.section.heading),
      field("current_timestamp", input.section.timestamp),
      field("current_script", input.section.script),
      field("change_request", input.instruction),
    ]
      .filter(Boolean)
      .join("\n"),
};
