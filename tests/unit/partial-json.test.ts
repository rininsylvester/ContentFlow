import { describe, expect, it } from "vitest";
import { parsePartialJson } from "@/lib/ai/partial-json";

describe("parsePartialJson", () => {
  it("parses complete JSON", () => {
    expect(parsePartialJson('{"a":[1,2]}')).toEqual({ a: [1, 2] });
  });

  it("returns undefined for empty or hopeless input", () => {
    expect(parsePartialJson("")).toBeUndefined();
    expect(parsePartialJson("   ")).toBeUndefined();
  });

  it("closes an open string value", () => {
    expect(parsePartialJson('{"title": "Hel')).toEqual({ title: "Hel" });
  });

  it("drops a key without a value", () => {
    expect(parsePartialJson('{"a": 1, "b')).toEqual({ a: 1 });
    expect(parsePartialJson('{"a": 1, "b"')).toEqual({ a: 1 });
    expect(parsePartialJson('{"a": 1, "b":')).toEqual({ a: 1 });
    expect(parsePartialJson('{"b')).toEqual({});
  });

  it("keeps a partial string inside an array", () => {
    expect(parsePartialJson('{"tags": ["one", "tw')).toEqual({ tags: ["one", "tw"] });
  });

  it("handles nested objects in arrays mid-stream", () => {
    const text = '{"ideas": [{"title": "A", "hook": "x"}, {"title": "B", "ho';
    expect(parsePartialJson(text)).toEqual({ ideas: [{ title: "A", hook: "x" }, { title: "B" }] });
  });

  it("drops a partial literal", () => {
    expect(parsePartialJson('{"done": tr')).toEqual({});
    expect(parsePartialJson('{"n": 1, "ok": fal')).toEqual({ n: 1 });
  });

  it("handles trailing commas and escaped quotes", () => {
    expect(parsePartialJson('{"a": [1, 2,')).toEqual({ a: [1, 2] });
    expect(parsePartialJson('{"q": "say \\"hi\\" and')).toEqual({ q: 'say "hi" and' });
    expect(parsePartialJson('{"q": "trailing \\')).toEqual({ q: "trailing " });
  });
});
