"use client";

import { ArrowDownWideNarrow } from "lucide-react";
import { useState } from "react";
import { usePaywall } from "@/components/billing/use-paywall";
import { CopyButton } from "@/components/output/copy-button";
import { GenerationErrorAlert } from "@/components/output/generation-error";
import { SaveButton } from "@/components/output/save-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { usePersistentState } from "@/hooks/use-persistent-state";
import { useGeneration } from "@/hooks/use-generation";
import { HOOK_FRAMEWORK_LABELS, HOOK_FRAMEWORKS, PLATFORMS } from "@/lib/ai/options";
import { asArray, asRecord, asString } from "@/lib/ai/partial";
import type { HooksInput, HooksOutput } from "@/lib/ai/schemas/hooks";
import { cn } from "@/lib/utils";
import { BrandVoiceToggle } from "../brand-voice-toggle";
import { EmptyState } from "../empty-state";
import { FormField } from "../form-field";
import { GenerateButton, StreamingNotice, ToolWorkspace } from "../tool-workspace";

type Form = {
  topic: string;
  platform: HooksInput["platform"];
  audience: string;
  useBrandVoice: boolean;
};
const INITIAL: Form = { topic: "", platform: "YouTube", audience: "", useBrandVoice: true };
type Framework = (typeof HOOK_FRAMEWORKS)[number];

const EXAMPLES = [
  "Why most people fail at learning a language",
  "My first year as a full-time creator",
  "How to edit videos 2x faster",
];

function scoreClass(score: number) {
  if (score >= 8) return "border-success/40 text-success";
  if (score >= 5) return "border-warning/40 text-warning";
  return "text-muted-foreground";
}

export function HooksTool() {
  const [form, setForm] = usePersistentState<Form>("creatorhub:draft:hooks", INITIAL);
  const [filter, setFilter] = useState<Framework | "all">("all");
  const [sortByScore, setSortByScore] = useState(false);
  const { onError, paywall } = usePaywall();
  const gen = useGeneration<HooksOutput>("hooks", { onError });
  const update = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  function generate() {
    void gen.start({
      input: { topic: form.topic, platform: form.platform, audience: form.audience || undefined },
      useBrandVoice: form.useBrandVoice,
    });
  }

  const streaming = gen.status === "streaming";
  const hooks = asArray(asRecord(gen.partial).hooks)
    .map(asRecord)
    .map((h) => ({
      text: asString(h.text),
      framework: asString(h.framework) as Framework,
      reason: asString(h.reason),
      score: typeof h.score === "number" ? h.score : null,
    }))
    .filter((h) => h.text);
  const visible = hooks
    .filter((h) => filter === "all" || h.framework === filter)
    .sort((a, b) => (sortByScore ? (b.score ?? 0) - (a.score ?? 0) : 0));

  return (
    <>
      <ToolWorkspace
        formLabel="Hook and title lab"
        resultsLabel="Generated hooks"
        busy={streaming}
        onSubmit={generate}
        form={
          <>
            <FormField id="topic" label="Topic">
              <Input
                id="topic"
                required
                minLength={3}
                maxLength={500}
                placeholder="e.g. How to edit videos 2x faster"
                value={form.topic}
                onChange={(e) => update("topic", e.target.value)}
              />
            </FormField>
            <FormField id="platform" label="Platform">
              <NativeSelect
                id="platform"
                value={form.platform}
                onChange={(e) => update("platform", e.target.value as Form["platform"])}
              >
                {PLATFORMS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField id="audience" label="Audience (optional)">
              <Input
                id="audience"
                maxLength={200}
                placeholder="e.g. Beginner video editors"
                value={form.audience}
                onChange={(e) => update("audience", e.target.value)}
              />
            </FormField>
            <BrandVoiceToggle
              checked={form.useBrandVoice}
              onCheckedChange={(v) => update("useBrandVoice", v)}
            />
            <GenerateButton streaming={streaming} onStop={gen.stop}>
              Generate 15 hooks
            </GenerateButton>
          </>
        }
        results={
          <>
            <GenerationErrorAlert error={gen.error} onRetry={generate} />
            {gen.status === "idle" && (
              <EmptyState
                title="Get 15 hooks and titles across five proven frameworks."
                examples={EXAMPLES}
                onSelectExample={(ex) => update("topic", ex)}
              />
            )}
            {streaming && hooks.length === 0 && <StreamingNotice>Writing hooks…</StreamingNotice>}
            {hooks.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <div role="group" aria-label="Filter by framework" className="flex flex-wrap gap-1">
                  {(["all", ...HOOK_FRAMEWORKS] as const).map((f) => (
                    <Button
                      key={f}
                      type="button"
                      size="sm"
                      variant={filter === f ? "secondary" : "ghost"}
                      aria-pressed={filter === f}
                      onClick={() => setFilter(f)}
                    >
                      {f === "all" ? "All" : HOOK_FRAMEWORK_LABELS[f]}
                    </Button>
                  ))}
                </div>
                <div className="ml-auto flex gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={sortByScore ? "secondary" : "ghost"}
                    aria-pressed={sortByScore}
                    onClick={() => setSortByScore((v) => !v)}
                  >
                    <ArrowDownWideNarrow />
                    Sort by score
                  </Button>
                  {gen.status === "done" && gen.output && (
                    <SaveButton
                      tool="hooks"
                      title={`Hooks: ${form.topic}`.slice(0, 300)}
                      content={{ ...gen.output, topic: form.topic }}
                      generationId={gen.generationId}
                    />
                  )}
                </div>
              </div>
            )}
            <ul className="grid gap-3 md:grid-cols-2">
              {visible.map((h, i) => (
                <li
                  key={`${h.text}-${i}`}
                  className="flex flex-col gap-2 rounded-xl border bg-card p-4 text-sm shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    {HOOK_FRAMEWORK_LABELS[h.framework] && (
                      <Badge variant="secondary">{HOOK_FRAMEWORK_LABELS[h.framework]}</Badge>
                    )}
                    {h.score !== null && (
                      <Badge
                        variant="outline"
                        className={cn("tabular-nums", scoreClass(h.score))}
                        aria-label={`Score ${h.score} out of 10`}
                      >
                        {h.score}/10
                      </Badge>
                    )}
                    <CopyButton text={h.text} label={`Copy hook: ${h.text}`} className="ml-auto" />
                  </div>
                  <p className="font-medium">{h.text}</p>
                  {h.reason && <p className="text-muted-foreground">{h.reason}</p>}
                </li>
              ))}
              {streaming && hooks.length > 0 && hooks.length < 15 && (
                <Skeleton className="h-28 w-full rounded-xl" />
              )}
            </ul>
          </>
        }
      />
      {paywall}
    </>
  );
}
