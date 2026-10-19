"use client";

import { Info } from "lucide-react";
import { usePaywall } from "@/components/billing/use-paywall";
import { CopyButton } from "@/components/output/copy-button";
import { GenerationErrorAlert } from "@/components/output/generation-error";
import { ResultCard } from "@/components/output/result-card";
import { SaveButton } from "@/components/output/save-button";
import { TagList } from "@/components/output/tag-list";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { usePersistentState } from "@/hooks/use-persistent-state";
import { useGeneration } from "@/hooks/use-generation";
import { PLATFORMS } from "@/lib/ai/options";
import { asRecord, asString, asStringArray } from "@/lib/ai/partial";
import type { SeoInput } from "@/lib/ai/schemas/seo";
import type { KeywordMetrics, SeoResult } from "@/lib/seo/keyword-provider";
import { BrandVoiceToggle } from "../brand-voice-toggle";
import { EmptyState } from "../empty-state";
import { FormField } from "../form-field";
import { GenerateButton, StreamingNotice, ToolWorkspace } from "../tool-workspace";

type Form = { topic: string; platform: SeoInput["platform"]; useBrandVoice: boolean };
const INITIAL: Form = { topic: "", platform: "YouTube", useBrandVoice: true };

const EXAMPLES: { label: string; form: Partial<Form> }[] = [
  {
    label: "Home espresso for beginners — YouTube",
    form: { topic: "Home espresso for beginners", platform: "YouTube" },
  },
  {
    label: "Sourdough starter troubleshooting — blog",
    form: { topic: "Sourdough starter troubleshooting", platform: "Blog" },
  },
  {
    label: "Minimalist wardrobe — Instagram",
    form: { topic: "Minimalist capsule wardrobe", platform: "Instagram" },
  },
];

function KeywordChips({
  items,
  metrics,
}: {
  items: string[];
  metrics: Record<string, KeywordMetrics>;
}) {
  if (items.length === 0) return <Skeleton className="h-6 w-2/3" />;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {items.map((k, i) => {
        const m = metrics[k];
        return (
          <span key={`${k}-${i}`} className="rounded-md border bg-muted/50 px-2 py-0.5 text-xs">
            {k}
            {m?.volume != null && (
              <span className="ml-1 text-muted-foreground">· {m.volume.toLocaleString()}/mo</span>
            )}
          </span>
        );
      })}
      <CopyButton text={items.join(", ")} label="Copy all" />
    </div>
  );
}

export function SeoTool() {
  const [form, setForm] = usePersistentState<Form>("creatorhub:draft:seo", INITIAL);
  const { onError, paywall } = usePaywall();
  const gen = useGeneration<SeoResult>("seo", { onError });
  const update = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  function generate() {
    void gen.start({
      input: { topic: form.topic, platform: form.platform },
      useBrandVoice: form.useBrandVoice,
    });
  }

  const streaming = gen.status === "streaming";
  const d = asRecord(gen.partial);
  const hashtags = asRecord(d.hashtags);
  const keywordData = asRecord(d.keywordData);
  const metrics = asRecord(keywordData.metrics) as Record<string, KeywordMetrics>;
  const hasResult = Boolean(asString(d.primaryKeyword));
  const title = asString(d.optimizedTitle);
  const description = asString(d.description);

  return (
    <>
      <ToolWorkspace
        formLabel="SEO and keywords"
        resultsLabel="SEO results"
        busy={streaming}
        onSubmit={generate}
        form={
          <>
            <FormField id="topic" label="Topic">
              <Input
                id="topic"
                required
                minLength={3}
                maxLength={300}
                placeholder="e.g. Home espresso for beginners"
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
            <BrandVoiceToggle
              checked={form.useBrandVoice}
              onCheckedChange={(v) => update("useBrandVoice", v)}
            />
            <GenerateButton streaming={streaming} onStop={gen.stop}>
              Generate SEO pack
            </GenerateButton>
          </>
        }
        results={
          <>
            <GenerationErrorAlert error={gen.error} onRetry={generate} />
            {gen.status === "idle" && (
              <EmptyState
                title="Get keywords, an optimized title, description, tags and hashtags."
                examples={EXAMPLES.map((e) => e.label)}
                onSelectExample={(label) => {
                  const ex = EXAMPLES.find((e) => e.label === label);
                  if (ex) setForm((f) => ({ ...f, ...ex.form }));
                }}
              />
            )}
            {streaming && !hasResult && <StreamingNotice>Researching keywords…</StreamingNotice>}
            {hasResult && (
              <>
                <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm">
                  <Info className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
                  <p>
                    {asString(keywordData.label) || "AI-suggested — not live search-volume data"}.
                    Use these as a starting point and validate important keywords with a search
                    tool.
                  </p>
                </div>
                <ResultCard
                  title="Primary keyword"
                  copyText={asString(d.primaryKeyword)}
                  actions={
                    gen.status === "done" && gen.output ? (
                      <SaveButton
                        tool="seo"
                        title={`SEO: ${form.topic}`.slice(0, 300)}
                        content={{ ...gen.output, topic: form.topic, platform: form.platform }}
                        generationId={gen.generationId}
                      />
                    ) : null
                  }
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-semibold">{asString(d.primaryKeyword)}</p>
                    {asString(d.searchIntent) && (
                      <Badge variant="secondary" className="capitalize">
                        {asString(d.searchIntent)} intent
                      </Badge>
                    )}
                  </div>
                </ResultCard>
                <div className="grid gap-4 md:grid-cols-2">
                  <ResultCard title="Secondary keywords">
                    <KeywordChips items={asStringArray(d.secondaryKeywords)} metrics={metrics} />
                  </ResultCard>
                  <ResultCard title="Long-tail keywords">
                    <KeywordChips items={asStringArray(d.longTailKeywords)} metrics={metrics} />
                  </ResultCard>
                </div>
                {title && (
                  <ResultCard title="Optimized title" copyText={title}>
                    <p className="font-medium">{title}</p>
                    <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                      {title.length} characters
                    </p>
                  </ResultCard>
                )}
                {description && (
                  <ResultCard title="Description / caption" copyText={description}>
                    <p className="text-sm whitespace-pre-wrap">{description}</p>
                  </ResultCard>
                )}
                {asStringArray(d.tags).length > 0 && (
                  <ResultCard title="Tags">
                    <TagList items={asStringArray(d.tags)} />
                  </ResultCard>
                )}
                {(asStringArray(hashtags.broad).length > 0 ||
                  asStringArray(hashtags.niche).length > 0) && (
                  <ResultCard
                    title="Hashtags"
                    copyText={[
                      ...asStringArray(hashtags.broad),
                      ...asStringArray(hashtags.niche),
                    ].join(" ")}
                  >
                    <div className="space-y-3">
                      <div>
                        <p className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                          Broad
                        </p>
                        <TagList items={asStringArray(hashtags.broad)} separator=" " />
                      </div>
                      <div>
                        <p className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                          Niche
                        </p>
                        <TagList items={asStringArray(hashtags.niche)} separator=" " />
                      </div>
                    </div>
                  </ResultCard>
                )}
              </>
            )}
          </>
        }
      />
      {paywall}
    </>
  );
}
