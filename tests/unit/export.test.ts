import { describe, expect, it } from "vitest";
import type { ScriptOutput } from "@/lib/ai/schemas/script";
import { scriptToMarkdown, scriptToText, slugify } from "@/lib/export/script";

const script: ScriptOutput = {
  title: "Lift Better",
  estimatedDuration: "60 seconds",
  hooks: [{ text: "Stop doing this.", style: "contrarian" }],
  sections: [
    {
      heading: "Hook",
      timestamp: "0:00-0:05",
      script: "Say it.",
      bRoll: ["gym", ""],
      onScreenText: ["  "],
    },
  ],
  cta: "Follow for more.",
};

describe("script export", () => {
  it("renders markdown with sections and drops blank list items", () => {
    const md = scriptToMarkdown(script);
    expect(md).toContain("# Lift Better");
    expect(md).toContain("1. **contrarian:** Stop doing this.");
    expect(md).toContain("## Hook (0:00-0:05)");
    expect(md).toContain("- gym");
    expect(md).not.toContain("On-screen text");
    expect(md).not.toMatch(/^- $/m);
  });

  it("renders plain text without markdown syntax", () => {
    const txt = scriptToText(script);
    expect(txt).toContain("LIFT BETTER");
    expect(txt).toContain("B-roll: gym");
    expect(txt).not.toContain("#");
    expect(txt).not.toContain("**");
  });

  it("slugifies titles into safe filenames", () => {
    expect(slugify("My Video: Part 2!")).toBe("my-video-part-2");
    expect(slugify("!!!")).toBe("script");
  });
});
