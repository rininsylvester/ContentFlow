"use client";

import { Bookmark, BookmarkCheck, ChevronDown, Loader2, PenLine, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { PaywallDialog } from "@/components/billing/paywall-dialog";
import { CopyButton } from "@/components/output/copy-button";
import { GenerationErrorAlert, isPaywallError } from "@/components/output/generation-error";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DRAFT_KEYS, writeDraft } from "@/hooks/use-persistent-state";
import { useGeneration } from "@/hooks/use-generation";
import { saveItem } from "@/lib/actions/save-item";
import { asRecord, asString, asStringArray } from "@/lib/ai/partial";
import type { Idea, IdeaExpansion, IdeasInput } from "@/lib/ai/schemas/ideas";
import { cn } from "@/lib/utils";

const DIFFICULTY_STYLES: Record<string, string> = {
  easy: "border-success/40 text-success",
  medium: "border-warning/40 text-warning",
  hard: "border-destructive/40 text-destructive",
};

function toIdea(raw: Record<string, unknown>): Idea {
  const difficulty = asString(raw.difficulty);
  return {
    title: asString(raw.title),
    angle: asString(raw.angle),
    hook: asString(raw.hook),
    whyItWorks: asString(raw.whyItWorks),
    difficulty: difficulty === "medium" || difficulty === "hard" ? difficulty : "easy",
  };
}

export function IdeaCard({
  idea: raw,
  index,
  complete,
  actionsEnabled,
  context,
  parentGenerationId,
}: {
  idea: Record<string, unknown>;
  index: number;
  complete: boolean;
  actionsEnabled: boolean;
  context: IdeasInput | null;
  parentGenerationId: string | undefined;
}) {
  const router = useRouter();
  const idea = toIdea(raw);
  const [saved, setSaved] = useState(false);
  const [saving, startSaving] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const expand = useGeneration<IdeaExpansion>("ideas-expand", {
    onDone: () => setExpanded(true),
    onError: (error) => {
      if (isPaywallError(error)) setPaywallOpen(true);
    },
  });

  const ideaText = `${idea.title}\n\nAngle: ${idea.angle}\nHook: ${idea.hook}\nWhy it works: ${idea.whyItWorks}\nDifficulty: ${idea.difficulty}`;

  function runExpand() {
    if (!context) return;
    setExpanded(true);
    void expand.start({ input: { idea, context }, parentId: parentGenerationId });
  }

  function writeScript() {
    writeDraft(DRAFT_KEYS.script, {
      topic: `${idea.title}\n\nAngle: ${idea.angle}\nOpening hook: ${idea.hook}`,
      ...(context ? { platform: context.platform } : {}),
    });
    router.push("/scripts");
  }

  function save() {
    startSaving(async () => {
      const result = await saveItem({
        tool: "ideas",
        title: idea.title,
        content: { idea, context, expansion: expand.output ?? null },
        generationId: parentGenerationId,
      });
      if (result.ok) {
        setSaved(true);
        toast.success("Saved to your library");
      } else {
        toast.error(result.error);
      }
    });
  }

  const expansion = asRecord(expand.partial);

  return (
    <article
      aria-labelledby={`idea-${index}-title`}
      className="flex flex-col gap-3 rounded-xl border bg-card p-5 text-card-foreground shadow-sm"
    >
      <header className="flex items-start gap-3">
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              {String(index + 1).padStart(2, "0")}
            </span>
            {complete && (
              <Badge
                variant="outline"
                className={cn("capitalize", DIFFICULTY_STYLES[idea.difficulty])}
              >
                {idea.difficulty}
              </Badge>
            )}
          </div>
          <h3 id={`idea-${index}-title`} className="leading-snug font-semibold">
            {idea.title || <span className="block h-5 w-3/4 animate-pulse rounded-md bg-accent" />}
          </h3>
        </div>
        {complete && <CopyButton text={ideaText} label={`Copy idea ${index + 1}`} />}
      </header>

      <dl className="space-y-2 text-sm">
        {idea.hook && (
          <div>
            <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Hook
            </dt>
            <dd className="italic">“{idea.hook}”</dd>
          </div>
        )}
        {idea.angle && (
          <div>
            <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Angle
            </dt>
            <dd>{idea.angle}</dd>
          </div>
        )}
        {idea.whyItWorks && (
          <div>
            <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Why it works
            </dt>
            <dd className="text-muted-foreground">{idea.whyItWorks}</dd>
          </div>
        )}
      </dl>

      {complete && (
        <div className="-mx-2 mt-auto pt-1">
          <div className="flex flex-wrap gap-1">
            <Button
              size="sm"
              variant="ghost"
              disabled={!actionsEnabled || !context || expand.status === "streaming"}
              onClick={expand.output ? () => setExpanded((v) => !v) : runExpand}
              aria-expanded={expanded}
            >
              {expand.status === "streaming" ? (
                <Loader2 className="animate-spin" />
              ) : expand.output ? (
                <ChevronDown className={cn("transition-transform", expanded && "rotate-180")} />
              ) : (
                <Sparkles />
              )}
              Expand
            </Button>
            <Button size="sm" variant="ghost" disabled={!actionsEnabled} onClick={writeScript}>
              <PenLine />
              Write script
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={!actionsEnabled || saving || saved}
              onClick={save}
            >
              {saved ? <BookmarkCheck /> : <Bookmark />}
              {saved ? "Saved" : "Save"}
            </Button>
          </div>
        </div>
      )}

      {expanded && (expand.status === "streaming" || expand.output) && (
        <div className="space-y-3 border-t pt-3 text-sm">
          {asString(expansion.summary) ? (
            <p>{asString(expansion.summary)}</p>
          ) : (
            <Skeleton className="h-10 w-full" />
          )}
          <ExpansionList title="Outline" items={asStringArray(expansion.outline)} ordered />
          <ExpansionList title="Key points" items={asStringArray(expansion.keyPoints)} />
          <ExpansionList title="Examples to include" items={asStringArray(expansion.examples)} />
          {asString(expansion.cta) && (
            <p>
              <span className="font-medium">CTA: </span>
              {asString(expansion.cta)}
            </p>
          )}
        </div>
      )}
      <GenerationErrorAlert error={expand.error} onRetry={runExpand} />
      {isPaywallError(expand.error) && (
        <PaywallDialog
          open={paywallOpen}
          onOpenChange={setPaywallOpen}
          reason={expand.error?.code === "cap_reached" ? "cap_reached" : "trial_exhausted"}
        />
      )}
    </article>
  );
}

function ExpansionList({
  title,
  items,
  ordered = false,
}: {
  title: string;
  items: string[];
  ordered?: boolean;
}) {
  if (items.length === 0) return null;
  const List = ordered ? "ol" : "ul";
  return (
    <div>
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</p>
      <List className={cn("mt-1 space-y-1 pl-5", ordered ? "list-decimal" : "list-disc")}>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </List>
    </div>
  );
}
