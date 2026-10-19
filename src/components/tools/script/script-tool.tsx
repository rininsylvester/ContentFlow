"use client";

import { Loader2, Square, Wand2 } from "lucide-react";
import { useState } from "react";
import { PaywallDialog } from "@/components/billing/paywall-dialog";
import { GenerationErrorAlert, isPaywallError } from "@/components/output/generation-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { DRAFT_KEYS, usePersistentState } from "@/hooks/use-persistent-state";
import { useGeneration } from "@/hooks/use-generation";
import {
  PLATFORMS,
  SCRIPT_FORMAT_LABELS,
  SCRIPT_FORMATS,
  SCRIPT_LENGTH_LABELS,
  SCRIPT_LENGTHS,
  TONE_SUGGESTIONS,
} from "@/lib/ai/options";
import type { ScriptInput, ScriptOutput } from "@/lib/ai/schemas/script";
import { BrandVoiceToggle } from "../brand-voice-toggle";
import { EmptyState } from "../empty-state";
import { FormField } from "../form-field";
import { ScriptEditor, ScriptPreview } from "./script-view";

type Form = {
  topic: string;
  platform: ScriptInput["platform"];
  format: ScriptInput["format"];
  length: ScriptInput["length"];
  tone: string;
  cta: string;
  useBrandVoice: boolean;
};

const INITIAL: Form = {
  topic: "",
  platform: "TikTok",
  format: "short-form",
  length: "60s",
  tone: "Energetic",
  cta: "",
  useBrandVoice: true,
};

/** The editable result, persisted so edits survive reloads. */
export type ScriptResult = { script: ScriptOutput; generationId: string; input: ScriptInput };

const EXAMPLES: { label: string; form: Partial<Form> }[] = [
  {
    label: "60s TikTok: 3 mistakes beginners make lifting weights",
    form: {
      topic: "3 mistakes beginners make lifting weights",
      platform: "TikTok",
      format: "short-form",
      length: "60s",
    },
  },
  {
    label: "10-minute YouTube video on meal prep for the week",
    form: {
      topic: "Meal prep for the whole week in one hour",
      platform: "YouTube",
      format: "long-form",
      length: "10min+",
    },
  },
  {
    label: "Podcast outline: how I grew a newsletter to 10k subscribers",
    form: {
      topic: "How I grew a newsletter to 10k subscribers",
      platform: "Podcast",
      format: "podcast",
      length: "10min+",
    },
  },
];

export function ScriptTool() {
  const [form, setForm] = usePersistentState<Form>(DRAFT_KEYS.script, INITIAL);
  const [result, setResult] = usePersistentState<{ value: ScriptResult | null }>(
    DRAFT_KEYS.scriptResult,
    {
      value: null,
    },
  );
  const [submitted, setSubmitted] = useState<ScriptInput | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);

  const gen = useGeneration<ScriptOutput>("script", {
    onDone: (script, generationId) => {
      if (submitted) setResult({ value: { script, generationId, input: submitted } });
    },
    onError: (error) => {
      if (isPaywallError(error)) setPaywallOpen(true);
    },
  });

  const update = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  function generate() {
    const input: ScriptInput = {
      topic: form.topic,
      platform: form.platform,
      format: form.format,
      length: form.length,
      tone: form.tone,
      cta: form.cta || undefined,
    };
    setSubmitted(input);
    void gen.start({ input, useBrandVoice: form.useBrandVoice });
  }

  const streaming = gen.status === "streaming";
  const current = result.value;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <form
        className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start"
        onSubmit={(e) => {
          e.preventDefault();
          if (!streaming) generate();
        }}
        aria-label="Script writer"
      >
        <FormField id="topic" label="Idea or topic">
          <Textarea
            id="topic"
            required
            minLength={3}
            maxLength={1500}
            rows={4}
            placeholder="e.g. 3 mistakes beginners make lifting weights"
            value={form.topic}
            onChange={(e) => update("topic", e.target.value)}
          />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
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
          <FormField id="length" label="Length">
            <NativeSelect
              id="length"
              value={form.length}
              onChange={(e) => update("length", e.target.value as Form["length"])}
            >
              {SCRIPT_LENGTHS.map((l) => (
                <option key={l} value={l}>
                  {SCRIPT_LENGTH_LABELS[l]}
                </option>
              ))}
            </NativeSelect>
          </FormField>
        </div>
        <FormField id="format" label="Format">
          <NativeSelect
            id="format"
            value={form.format}
            onChange={(e) => update("format", e.target.value as Form["format"])}
          >
            {SCRIPT_FORMATS.map((f) => (
              <option key={f} value={f}>
                {SCRIPT_FORMAT_LABELS[f]}
              </option>
            ))}
          </NativeSelect>
        </FormField>
        <FormField id="tone" label="Tone">
          <Input
            id="tone"
            required
            minLength={2}
            maxLength={60}
            list="tone-suggestions"
            value={form.tone}
            onChange={(e) => update("tone", e.target.value)}
          />
          <datalist id="tone-suggestions">
            {TONE_SUGGESTIONS.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </FormField>
        <FormField id="cta" label="Call to action (optional)">
          <Input
            id="cta"
            maxLength={200}
            placeholder="e.g. Follow for part 2"
            value={form.cta}
            onChange={(e) => update("cta", e.target.value)}
          />
        </FormField>
        <BrandVoiceToggle
          checked={form.useBrandVoice}
          onCheckedChange={(v) => update("useBrandVoice", v)}
        />
        {streaming ? (
          <Button type="button" variant="outline" onClick={gen.stop}>
            <Square />
            Stop
          </Button>
        ) : (
          <Button type="submit">
            <Wand2 />
            {current ? "Write a new script" : "Write script"}
          </Button>
        )}
      </form>

      <section
        aria-label="Script"
        aria-live="polite"
        aria-busy={streaming}
        className="flex min-w-0 flex-col gap-4"
      >
        <GenerationErrorAlert error={gen.error} onRetry={generate} />
        {streaming ? (
          gen.partial ? (
            <ScriptPreview partial={gen.partial} />
          ) : (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Writing your script…
            </p>
          )
        ) : current ? (
          <ScriptEditor
            result={current}
            onChange={(script) => setResult({ value: { ...current, script } })}
            onClear={() => setResult({ value: null })}
          />
        ) : (
          gen.status !== "error" && (
            <EmptyState
              title="Describe your video, episode or post to get a full script."
              examples={EXAMPLES.map((e) => e.label)}
              onSelectExample={(label) => {
                const ex = EXAMPLES.find((e) => e.label === label);
                if (ex) setForm((f) => ({ ...f, ...ex.form }));
              }}
            />
          )
        )}
      </section>

      {isPaywallError(gen.error) && (
        <PaywallDialog
          open={paywallOpen}
          onOpenChange={setPaywallOpen}
          reason={gen.error?.code === "cap_reached" ? "cap_reached" : "trial_exhausted"}
        />
      )}
    </div>
  );
}
