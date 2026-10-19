import { asArray, asRecord, asString, asStringArray } from "@/lib/ai/partial";
import type { ScriptOutput } from "@/lib/ai/schemas/script";
import { scriptOutputSchema } from "@/lib/ai/schemas/script";
import { scriptToText } from "@/lib/export/script";
import type { Tool } from "@/lib/db/schema/enums";

/**
 * Turns a saved item's JSON content into readable plain text, for the detail
 * view, copy and search previews. Content is untrusted JSON from the database,
 * so every field is read defensively.
 */
export function savedItemToText(tool: Tool, content: unknown): string {
  const c = asRecord(content);
  switch (tool) {
    case "ideas": {
      const idea = asRecord(c.idea);
      const exp = asRecord(c.expansion);
      const lines = [
        asString(idea.title),
        "",
        `Hook: ${asString(idea.hook)}`,
        `Angle: ${asString(idea.angle)}`,
        `Why it works: ${asString(idea.whyItWorks)}`,
        `Difficulty: ${asString(idea.difficulty)}`,
      ];
      if (asString(exp.summary)) {
        lines.push("", "Brief", asString(exp.summary));
        const outline = asStringArray(exp.outline);
        if (outline.length) lines.push("", "Outline", ...outline.map((o, i) => `${i + 1}. ${o}`));
        const points = asStringArray(exp.keyPoints);
        if (points.length) lines.push("", "Key points", ...points.map((p) => `- ${p}`));
        if (asString(exp.cta)) lines.push("", `CTA: ${asString(exp.cta)}`);
      }
      return lines.join("\n").trim();
    }
    case "script": {
      const parsed = scriptOutputSchema.safeParse(c.script);
      return parsed.success
        ? scriptToText(parsed.data as ScriptOutput)
        : asString(asRecord(c.script).title);
    }
    case "hooks":
      return asArray(c.hooks)
        .map(asRecord)
        .map(
          (h, i) =>
            `${i + 1}. ${asString(h.text)} (${asString(h.framework)}, ${String(h.score ?? "")}/10)`,
        )
        .join("\n");
    case "seo": {
      const hashtags = asRecord(c.hashtags);
      return [
        `Primary keyword: ${asString(c.primaryKeyword)} (${asString(c.searchIntent)})`,
        `Secondary: ${asStringArray(c.secondaryKeywords).join(", ")}`,
        `Long-tail: ${asStringArray(c.longTailKeywords).join(", ")}`,
        "",
        `Title: ${asString(c.optimizedTitle)}`,
        "",
        asString(c.description),
        "",
        `Tags: ${asStringArray(c.tags).join(", ")}`,
        `Hashtags: ${[...asStringArray(hashtags.broad), ...asStringArray(hashtags.niche)].join(" ")}`,
        "",
        "(AI-suggested — not live search-volume data)",
      ].join("\n");
    }
    case "aesthetics": {
      const palette = asArray(c.palette).map(asRecord);
      const fonts = asArray(c.fontPairings).map(asRecord);
      return [
        "Palette",
        ...palette.map((p) => `- ${asString(p.hex)} ${asString(p.name)} (${asString(p.role)})`),
        "",
        "Fonts",
        ...fonts.map((f) => `- ${asString(f.heading)} + ${asString(f.body)}`),
        "",
        asString(c.visualStyle),
        "",
        "Lighting",
        ...asStringArray(c.lighting).map((l) => `- ${l}`),
        "",
        "Camera",
        ...asStringArray(c.camera).map((l) => `- ${l}`),
        "",
        "Shot list",
        ...asArray(c.shotList)
          .map(asRecord)
          .map((s, i) => `${i + 1}. ${asString(s.shot)} — ${asString(s.purpose)}`),
      ].join("\n");
    }
    case "repurpose":
      return [
        "TikTok / Reels caption",
        asString(c.shortCaption),
        "",
        "YouTube description",
        asString(c.youtubeDescription),
        "",
        "Thread",
        ...asStringArray(c.thread).map((t, i) => `${i + 1}. ${t}`),
        "",
        "LinkedIn post",
        asString(c.linkedinPost),
        "",
        "Newsletter blurb",
        asString(c.newsletterBlurb),
      ].join("\n");
  }
}

/** A one- or two-line preview for library cards. */
export function savedItemPreview(tool: Tool, content: unknown, max = 160): string {
  const c = asRecord(content);
  const preview =
    tool === "ideas"
      ? asString(asRecord(c.idea).hook) || asString(asRecord(c.idea).angle)
      : tool === "script"
        ? asString(asRecord(asArray(asRecord(c.script).hooks)[0]).text)
        : tool === "hooks"
          ? asString(asRecord(asArray(c.hooks)[0]).text)
          : tool === "seo"
            ? asString(c.optimizedTitle)
            : tool === "aesthetics"
              ? asString(c.visualStyle)
              : asString(c.shortCaption);
  return preview.length > max ? `${preview.slice(0, max - 1)}…` : preview;
}

/** Hex colors to show as a strip on aesthetics cards. */
export function savedItemSwatches(tool: Tool, content: unknown): string[] {
  if (tool !== "aesthetics") return [];
  return asArray(asRecord(content).palette)
    .map((p) => asString(asRecord(p).hex))
    .filter((hex) => /^#[0-9a-f]{6}$/i.test(hex));
}
