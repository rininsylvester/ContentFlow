"use client";

import { usePaywall } from "@/components/billing/use-paywall";
import { CopyButton } from "@/components/output/copy-button";
import { GenerationErrorAlert } from "@/components/output/generation-error";
import { ResultCard } from "@/components/output/result-card";
import { SaveButton } from "@/components/output/save-button";
import { Textarea } from "@/components/ui/textarea";
import { usePersistentState } from "@/hooks/use-persistent-state";
import { useGeneration } from "@/hooks/use-generation";
import { REPURPOSE_FORMATS } from "@/lib/ai/options";
import { asRecord, asString, asStringArray } from "@/lib/ai/partial";
import type { RepurposeOutput } from "@/lib/ai/schemas/repurpose";
import { cn } from "@/lib/utils";
import { BrandVoiceToggle } from "../brand-voice-toggle";
import { EmptyState } from "../empty-state";
import { FormField } from "../form-field";
import { GenerateButton, StreamingNotice, ToolWorkspace } from "../tool-workspace";

type Form = { source: string; useBrandVoice: boolean };
const INITIAL: Form = { source: "", useBrandVoice: true };
const MIN = 50;
const MAX = 20_000;
const THREAD_LIMIT = 280;

export function RepurposeTool() {
  const [form, setForm] = usePersistentState<Form>("creatorhub:draft:repurpose", INITIAL);
  const { onError, paywall } = usePaywall();
  const gen = useGeneration<RepurposeOutput>("repurpose", { onError });

  function generate() {
    void gen.start({ input: { source: form.source }, useBrandVoice: form.useBrandVoice });
  }

  const streaming = gen.status === "streaming";
  const d = asRecord(gen.partial);
  const thread = asStringArray(d.thread);
  const anyOutput = REPURPOSE_FORMATS.some((f) =>
    f.key === "thread" ? thread.length > 0 : asString(d[f.key]),
  );
  const length = form.source.trim().length;

  return (
    <>
      <ToolWorkspace
        formLabel="Caption and repurposer"
        resultsLabel="Repurposed content"
        busy={streaming}
        onSubmit={generate}
        form={
          <>
            <FormField id="source" label="Script or long-form text">
              <Textarea
                id="source"
                required
                minLength={MIN}
                maxLength={MAX}
                rows={12}
                className="max-h-[60vh]"
                placeholder="Paste a video script, blog post, podcast transcript or newsletter…"
                aria-describedby="source-count"
                value={form.source}
                onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
              />
            </FormField>
            <p
              id="source-count"
              className={cn(
                "-mt-2 text-xs text-muted-foreground tabular-nums",
                length > 0 && length < MIN && "text-warning",
              )}
            >
              {length.toLocaleString()} / {MAX.toLocaleString()} characters
              {length > 0 && length < MIN ? ` — at least ${MIN} needed` : ""}
            </p>
            <BrandVoiceToggle
              checked={form.useBrandVoice}
              onCheckedChange={(v) => setForm((f) => ({ ...f, useBrandVoice: v }))}
            />
            <GenerateButton streaming={streaming} onStop={gen.stop}>
              Repurpose into 5 formats
            </GenerateButton>
          </>
        }
        results={
          <>
            <GenerationErrorAlert error={gen.error} onRetry={generate} />
            {gen.status === "idle" && (
              <EmptyState
                title="Paste one piece of content and get a caption, YouTube description, thread, LinkedIn post and newsletter blurb."
                examples={[
                  "Paste a YouTube script to get a LinkedIn post and X thread",
                  "Turn a blog post into a TikTok caption",
                ]}
              />
            )}
            {streaming && !anyOutput && <StreamingNotice>Repurposing…</StreamingNotice>}
            {gen.status === "done" && gen.output && (
              <div className="flex justify-end">
                <SaveButton
                  tool="repurpose"
                  title={`Repurposed: ${form.source.trim().slice(0, 60)}…`}
                  content={{ ...gen.output, source: form.source.slice(0, 5000) }}
                  generationId={gen.generationId}
                />
              </div>
            )}
            {REPURPOSE_FORMATS.map(({ key, label }) => {
              if (key === "thread") {
                if (thread.length === 0) return null;
                return (
                  <ResultCard key={key} title={label} copyText={thread.join("\n\n")}>
                    <ol className="space-y-3">
                      {thread.map((post, i) => (
                        <li key={i} className="flex gap-3 rounded-lg border p-3 text-sm">
                          <span className="font-mono text-xs text-muted-foreground tabular-nums">
                            {i + 1}/{thread.length}
                          </span>
                          <p className="flex-1 whitespace-pre-wrap">{post}</p>
                          <div className="flex flex-col items-end gap-1">
                            <CopyButton text={post} label={`Copy post ${i + 1}`} />
                            <span
                              className={cn(
                                "text-xs tabular-nums",
                                post.length > THREAD_LIMIT
                                  ? "text-destructive"
                                  : "text-muted-foreground",
                              )}
                            >
                              {post.length}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </ResultCard>
                );
              }
              const value = asString(d[key]);
              if (!value) return null;
              return (
                <ResultCard key={key} title={label} copyText={value}>
                  <p className="text-sm whitespace-pre-wrap">{value}</p>
                  <p className="mt-2 text-xs text-muted-foreground tabular-nums">
                    {value.length} characters
                  </p>
                </ResultCard>
              );
            })}
          </>
        }
      />
      {paywall}
    </>
  );
}
