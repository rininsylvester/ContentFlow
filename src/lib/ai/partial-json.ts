/**
 * Best-effort parse of an incomplete JSON document (a model response still
 * streaming in). Closes any open string, array or object and drops a dangling
 * key, comma or partial literal so the UI can render what has arrived so far.
 * Returns undefined when nothing usable can be recovered yet.
 */
export function parsePartialJson(input: string): unknown {
  let text = input.trim();
  for (let attempt = 0; attempt < 6 && text; attempt++) {
    try {
      return JSON.parse(complete(text));
    } catch {
      text = dropLastToken(text);
    }
  }
  return undefined;
}

type Container = "{" | "[";

function complete(text: string): string {
  const stack: Container[] = [];
  let inString = false;
  let escaped = false;
  for (const ch of text) {
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
    } else if (ch === '"') inString = true;
    else if (ch === "{" || ch === "[") stack.push(ch);
    else if (ch === "}" || ch === "]") stack.pop();
  }

  let out = text;
  if (inString) out = (escaped ? out.slice(0, -1) : out) + '"';

  out = out.trimEnd();
  if (stack.at(-1) === "{") {
    // Drop a key that has no value yet: `{"a": 1, "b"` / `{"a": 1, "b":` / `{"b"`
    out = out
      .replace(/,\s*"(?:[^"\\]|\\.)*"\s*:?$/, "")
      .replace(/\{\s*"(?:[^"\\]|\\.)*"\s*:?$/, "{");
  }
  out = out.replace(/[,:]\s*$/, "");

  for (let i = stack.length - 1; i >= 0; i--) out += stack[i] === "{" ? "}" : "]";
  return out;
}

/** Remove the last (possibly partial) value or literal fragment. */
function dropLastToken(text: string): string {
  const m = /^([\s\S]*?)\s*(?:"(?:[^"\\]|\\.)*"?|[^,{}[\]:"\s]+)\s*$/.exec(text);
  const rest = m?.[1];
  return rest !== undefined && rest !== text ? rest : "";
}
