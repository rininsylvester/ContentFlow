"use client";

import { Bookmark, BookmarkCheck, Download, FileText, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CopyButton } from "@/components/output/copy-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { saveItem } from "@/lib/actions/save-item";
import { asArray, asRecord, asString, asStringArray } from "@/lib/ai/partial";
import type { ScriptOutput, ScriptSection } from "@/lib/ai/schemas/script";
import { downloadText } from "@/lib/download";
import { scriptToMarkdown, scriptToText, slugify } from "@/lib/export/script";
import type { ScriptResult } from "./script-tool";
import { SectionCard, SectionPreview } from "./section-card";

/** Read-only view of a script that is still streaming in. */
export function ScriptPreview({ partial }: { partial: unknown }) {
  const data = asRecord(partial);
  const hooks = asArray(data.hooks).map(asRecord);
  const sections = asArray(data.sections).map(asRecord);
  return (
    <div className="flex flex-col gap-6">
      {asString(data.title) ? (
        <h2 className="text-xl font-semibold">{asString(data.title)}</h2>
      ) : (
        <Skeleton className="h-7 w-2/3" />
      )}
      <HooksList hooks={hooks.map((h) => ({ text: asString(h.text), style: asString(h.style) }))} />
      {sections.map((s, i) => (
        <SectionPreview
          key={i}
          section={{
            heading: asString(s.heading),
            timestamp: asString(s.timestamp),
            script: asString(s.script),
            bRoll: asStringArray(s.bRoll),
            onScreenText: asStringArray(s.onScreenText),
          }}
        />
      ))}
      <Skeleton className="h-24 w-full rounded-xl" />
    </div>
  );
}

/** Editable view of a finished script with per-section regenerate, export and save. */
export function ScriptEditor({
  result,
  onChange,
  onClear,
}: {
  result: ScriptResult;
  onChange: (script: ScriptOutput) => void;
  onClear: () => void;
}) {
  const { script, input, generationId } = result;
  const [saved, setSaved] = useState(false);
  const [saving, startSaving] = useTransition();

  const updateSection = (index: number, section: ScriptSection) => {
    onChange({ ...script, sections: script.sections.map((s, i) => (i === index ? section : s)) });
    setSaved(false);
  };

  function save() {
    startSaving(async () => {
      const res = await saveItem({
        tool: "script",
        title: script.title,
        content: { script, input },
        generationId,
      });
      if (res.ok) {
        setSaved(true);
        toast.success("Script saved to your library");
      } else {
        toast.error(res.error);
      }
    });
  }

  const filename = slugify(script.title);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex-1 space-y-2">
          <label htmlFor="script-title" className="sr-only">
            Script title
          </label>
          <Input
            id="script-title"
            value={script.title}
            maxLength={300}
            onChange={(e) => onChange({ ...script, title: e.target.value })}
            className="h-auto border-transparent bg-transparent px-0 text-xl font-semibold shadow-none focus-visible:border-input focus-visible:px-2 dark:bg-transparent"
          />
          <Badge variant="secondary">{script.estimatedDuration}</Badge>
        </div>
        <div className="flex flex-wrap gap-1">
          <CopyButton text={scriptToMarkdown(script)} label="Copy all" showLabel />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <Download />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() =>
                  downloadText(`${filename}.md`, scriptToMarkdown(script), "text/markdown")
                }
              >
                <FileText />
                Markdown (.md)
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => downloadText(`${filename}.txt`, scriptToText(script))}
              >
                <FileText />
                Plain text (.txt)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            disabled={saving || saved}
            onClick={save}
          >
            {saved ? <BookmarkCheck /> : <Bookmark />}
            {saved ? "Saved" : "Save"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={onClear}
            aria-label="Clear script"
          >
            <Trash2 />
          </Button>
        </div>
      </div>

      <HooksList hooks={script.hooks} />

      <ol className="flex flex-col gap-4" aria-label="Script sections">
        {script.sections.map((section, i) => (
          <li key={i}>
            <SectionCard
              index={i}
              section={section}
              onChange={(s) => updateSection(i, s)}
              context={{
                script: input,
                title: script.title,
                outline: script.sections.map((s) => s.heading),
              }}
              parentGenerationId={generationId}
            />
          </li>
        ))}
      </ol>

      <div className="rounded-xl border bg-card p-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-medium">Call to action</h3>
          <CopyButton text={script.cta} label="Copy call to action" />
        </div>
        <label htmlFor="script-cta" className="sr-only">
          Call to action
        </label>
        <textarea
          id="script-cta"
          value={script.cta}
          onChange={(e) => onChange({ ...script, cta: e.target.value })}
          className="field-sizing-content w-full resize-none bg-transparent text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        />
      </div>
    </div>
  );
}

function HooksList({ hooks }: { hooks: { text: string; style: string }[] }) {
  if (hooks.length === 0) return null;
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Hook options</h3>
      <ul className="grid gap-3 md:grid-cols-3">
        {hooks.map((h, i) => (
          <li key={i} className="flex flex-col gap-2 rounded-xl border bg-card p-4 text-sm">
            <div className="flex items-center justify-between gap-2">
              {h.style ? (
                <Badge variant="outline" className="capitalize">
                  {h.style}
                </Badge>
              ) : (
                <span />
              )}
              {h.text && <CopyButton text={h.text} label={`Copy hook ${i + 1}`} />}
            </div>
            <p>{h.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
