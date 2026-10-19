import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { describe, expect, it } from "vitest";
import { mockCompletion } from "@/lib/ai/mock";
import { TASK_IDS } from "@/lib/ai/models";
import { parseModelOutput } from "@/lib/ai/parse";
import { TASKS } from "@/lib/ai/tasks";
import { ideasOutputSchema } from "@/lib/ai/schemas/ideas";

const validIdea = {
  title: "T",
  angle: "A",
  hook: "H",
  whyItWorks: "W",
  difficulty: "easy",
};

describe("parseModelOutput", () => {
  it("accepts valid output", () => {
    const text = JSON.stringify({ ideas: Array(10).fill(validIdea) });
    const result = parseModelOutput(text, ideasOutputSchema);
    expect(result.ok).toBe(true);
  });

  it("tolerates a markdown code fence", () => {
    const text = "```json\n" + JSON.stringify({ ideas: Array(5).fill(validIdea) }) + "\n```";
    expect(parseModelOutput(text, ideasOutputSchema).ok).toBe(true);
  });

  it("rejects malformed JSON", () => {
    const result = parseModelOutput('{"ideas": [', ideasOutputSchema);
    expect(result).toEqual({ ok: false, error: "Output was not valid JSON" });
  });

  it("rejects output that doesn't match the schema, naming the path", () => {
    const text = JSON.stringify({ ideas: Array(5).fill({ ...validIdea, difficulty: "extreme" }) });
    const result = parseModelOutput(text, ideasOutputSchema);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("ideas.0.difficulty");
  });

  it("rejects too few ideas", () => {
    const text = JSON.stringify({ ideas: [validIdea] });
    expect(parseModelOutput(text, ideasOutputSchema).ok).toBe(false);
  });
});

describe("task output schemas", () => {
  it.each(TASK_IDS)("%s converts to a JSON schema for structured outputs", (id) => {
    const format = zodOutputFormat(TASKS[id].outputSchema);
    expect(format.type).toBe("json_schema");
    expect(format.schema).toMatchObject({ type: "object" });
  });

  it.each(TASK_IDS)("%s mock fixture passes its own schema", async (id) => {
    const chunks: string[] = [];
    const result = await mockCompletion(id, new AbortController().signal, (t) => chunks.push(t));
    expect(chunks.join("")).toBe(result.text);
    expect(parseModelOutput(result.text, TASKS[id].outputSchema).ok).toBe(true);
  });
});
