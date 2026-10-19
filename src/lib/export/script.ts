import type { ScriptOutput } from "@/lib/ai/schemas/script";

const clean = (items: string[]) => items.map((t) => t.trim()).filter(Boolean);

export function scriptToMarkdown(script: ScriptOutput): string {
  const lines: string[] = [
    `# ${script.title}`,
    "",
    `_Estimated duration: ${script.estimatedDuration}_`,
    "",
  ];
  lines.push("## Hook options", "");
  script.hooks.forEach((h, i) => lines.push(`${i + 1}. **${h.style}:** ${h.text}`));
  lines.push("");
  for (const s of script.sections) {
    lines.push(`## ${s.heading}${s.timestamp ? ` (${s.timestamp})` : ""}`, "", s.script, "");
    const onScreen = clean(s.onScreenText);
    const bRoll = clean(s.bRoll);
    if (onScreen.length) lines.push("**On-screen text:**", ...onScreen.map((t) => `- ${t}`), "");
    if (bRoll.length) lines.push("**B-roll:**", ...bRoll.map((t) => `- ${t}`), "");
  }
  lines.push("## Call to action", "", script.cta, "");
  return lines.join("\n");
}

export function scriptToText(script: ScriptOutput): string {
  const lines: string[] = [
    script.title.toUpperCase(),
    `Estimated duration: ${script.estimatedDuration}`,
    "",
  ];
  lines.push("HOOK OPTIONS");
  script.hooks.forEach((h, i) => lines.push(`${i + 1}. (${h.style}) ${h.text}`));
  lines.push("");
  for (const s of script.sections) {
    lines.push(`${s.heading.toUpperCase()}${s.timestamp ? ` [${s.timestamp}]` : ""}`, s.script);
    const onScreen = clean(s.onScreenText);
    const bRoll = clean(s.bRoll);
    if (onScreen.length) lines.push(`On-screen text: ${onScreen.join(" | ")}`);
    if (bRoll.length) lines.push(`B-roll: ${bRoll.join(" | ")}`);
    lines.push("");
  }
  lines.push("CALL TO ACTION", script.cta, "");
  return lines.join("\n");
}

/** A safe, short filename from a title. */
export function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "script"
  );
}
