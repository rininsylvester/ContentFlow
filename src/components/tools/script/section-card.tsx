"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { usePaywall } from "@/components/billing/use-paywall";
import { CopyButton } from "@/components/output/copy-button";
import { GenerationErrorAlert } from "@/components/output/generation-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useGeneration } from "@/hooks/use-generation";
import { asRecord, asString, asStringArray } from "@/lib/ai/partial";
import type { ScriptInput, ScriptSection } from "@/lib/ai/schemas/script";

const fieldClass =
  "field-sizing-content w-full resize-none rounded-md bg-transparent px-2 py-1 -mx-2 text-sm outline-none hover:bg-accent/40 focus-visible:bg-transparent focus-visible:ring-2 focus-visible:ring-ring/50";

function sectionText(s: ScriptSection): string {
  return [
    `${s.heading}${s.timestamp ? ` (${s.timestamp})` : ""}`,
    s.script,
    nonEmpty(s.onScreenText).length
      ? `On-screen text: ${nonEmpty(s.onScreenText).join(" | ")}`
      : "",
    nonEmpty(s.bRoll).length ? `B-roll: ${nonEmpty(s.bRoll).join(" | ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Keep blank lines while editing (so Enter works); exports drop them. */
const toLines = (value: string) => value.split("\n");
const nonEmpty = (items: string[]) => items.map((t) => t.trim()).filter(Boolean);

export function SectionPreview({ section }: { section: ScriptSection }) {
  return (
    <div className="rounded-xl border bg-card p-5 text-sm">
      <div className="mb-2 flex items-baseline gap-2">
        <h3 className="font-medium">{section.heading}</h3>
        {section.timestamp && (
          <span className="font-mono text-xs text-muted-foreground">{section.timestamp}</span>
        )}
      </div>
      <p className="whitespace-pre-wrap">{section.script}</p>
      <SideNotes section={section} />
    </div>
  );
}

function SideNotes({ section }: { section: ScriptSection }) {
  if (!section.onScreenText.length && !section.bRoll.length) return null;
  return (
    <div className="mt-3 grid gap-3 text-muted-foreground sm:grid-cols-2">
      {section.onScreenText.length > 0 && (
        <div>
          <p className="text-xs font-medium tracking-wide uppercase">On-screen text</p>
          <ul className="list-disc pl-5">
            {section.onScreenText.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      )}
      {section.bRoll.length > 0 && (
        <div>
          <p className="text-xs font-medium tracking-wide uppercase">B-roll</p>
          <ul className="list-disc pl-5">
            {section.bRoll.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function SectionCard({
  index,
  section,
  onChange,
  context,
  parentGenerationId,
}: {
  index: number;
  section: ScriptSection;
  onChange: (section: ScriptSection) => void;
  context: { script: ScriptInput; title: string; outline: string[] };
  parentGenerationId: string;
}) {
  const [instruction, setInstruction] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const { onError, paywall } = usePaywall();
  const regen = useGeneration<ScriptSection>("script-section", {
    onDone: (next) => onChange(next),
    onError,
  });
  const id = `section-${index}`;

  function regenerate() {
    setPopoverOpen(false);
    void regen.start({
      input: {
        ...context,
        sectionIndex: index,
        section,
        instruction: instruction.trim() || undefined,
      },
      parentId: parentGenerationId,
    });
  }

  if (regen.status === "streaming") {
    const p = asRecord(regen.partial);
    return (
      <div className="relative" aria-busy>
        <SectionPreview
          section={{
            heading: asString(p.heading) || section.heading,
            timestamp: asString(p.timestamp) || section.timestamp,
            script: asString(p.script) || "Rewriting…",
            bRoll: asStringArray(p.bRoll),
            onScreenText: asStringArray(p.onScreenText),
          }}
        />
        <Loader2
          className="absolute top-5 right-5 size-4 animate-spin text-muted-foreground"
          aria-label="Regenerating"
        />
      </div>
    );
  }

  return (
    <section aria-labelledby={`${id}-heading`} className="rounded-xl border bg-card p-5">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <label htmlFor={`${id}-heading`} className="sr-only">
          Section {index + 1} heading
        </label>
        <Input
          id={`${id}-heading`}
          value={section.heading}
          maxLength={300}
          onChange={(e) => onChange({ ...section, heading: e.target.value })}
          className="-mx-2 h-8 w-auto flex-1 border-transparent bg-transparent px-2 font-medium shadow-none dark:bg-transparent"
        />
        <label htmlFor={`${id}-ts`} className="sr-only">
          Section {index + 1} timestamp
        </label>
        <Input
          id={`${id}-ts`}
          value={section.timestamp}
          maxLength={40}
          onChange={(e) => onChange({ ...section, timestamp: e.target.value })}
          className="h-8 w-28 border-transparent bg-transparent font-mono text-xs text-muted-foreground shadow-none dark:bg-transparent"
        />
        <CopyButton text={sectionText(section)} label={`Copy section ${index + 1}`} />
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground"
              aria-label={`Regenerate section ${index + 1}`}
            >
              <RefreshCw />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="space-y-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                regenerate();
              }}
              className="space-y-3"
            >
              <Label htmlFor={`${id}-instruction`}>What should change? (optional)</Label>
              <Input
                id={`${id}-instruction`}
                maxLength={300}
                placeholder="e.g. Make it funnier"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
              />
              <Button type="submit" size="sm" className="w-full">
                <RefreshCw />
                Regenerate section
              </Button>
              <p className="text-xs text-muted-foreground">Uses 1 generation.</p>
            </form>
          </PopoverContent>
        </Popover>
      </div>

      <label htmlFor={`${id}-script`} className="sr-only">
        Section {index + 1} script
      </label>
      <textarea
        id={`${id}-script`}
        value={section.script}
        onChange={(e) => onChange({ ...section, script: e.target.value })}
        className={fieldClass}
      />

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor={`${id}-ost`}
            className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
          >
            On-screen text <span className="normal-case">(one per line)</span>
          </label>
          <textarea
            id={`${id}-ost`}
            value={section.onScreenText.join("\n")}
            onChange={(e) => onChange({ ...section, onScreenText: toLines(e.target.value) })}
            className={`${fieldClass} text-muted-foreground`}
          />
        </div>
        <div>
          <label
            htmlFor={`${id}-broll`}
            className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
          >
            B-roll <span className="normal-case">(one per line)</span>
          </label>
          <textarea
            id={`${id}-broll`}
            value={section.bRoll.join("\n")}
            onChange={(e) => onChange({ ...section, bRoll: toLines(e.target.value) })}
            className={`${fieldClass} text-muted-foreground`}
          />
        </div>
      </div>
      <div className="mt-3 empty:hidden">
        <GenerationErrorAlert error={regen.error} onRetry={regenerate} />
      </div>
      {paywall}
    </section>
  );
}
