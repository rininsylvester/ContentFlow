import type { z } from "zod";

export type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

/** Parse model text as JSON and validate it against the task's output schema. */
export function parseModelOutput<S extends z.ZodType>(
  text: string,
  schema: S,
): ParseResult<z.infer<S>> {
  let json: unknown;
  try {
    json = JSON.parse(stripCodeFence(text));
  } catch {
    return { ok: false, error: "Output was not valid JSON" };
  }
  const result = schema.safeParse(json);
  if (!result.success) {
    const issue = result.error.issues[0];
    return {
      ok: false,
      error: `Output did not match schema${issue ? ` at ${issue.path.join(".") || "root"}: ${issue.message}` : ""}`,
    };
  }
  return { ok: true, data: result.data };
}

/** Defensive: tolerate a ```json fence if one ever slips through. */
function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  const match = /^```(?:json)?\s*([\s\S]*?)\s*```$/.exec(trimmed);
  return match?.[1] ?? trimmed;
}
