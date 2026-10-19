"use client";

import { Loader2, Square, Wand2 } from "lucide-react";
import { useState } from "react";
import { usePaywall } from "@/components/billing/use-paywall";
import { GenerationErrorAlert } from "@/components/output/generation-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { DRAFT_KEYS, usePersistentState } from "@/hooks/use-persistent-state";
import { useGeneration } from "@/hooks/use-generation";
import { GOAL_LABELS, GOALS, PLATFORMS } from "@/lib/ai/options";
import { asArray, asRecord } from "@/lib/ai/partial";
import type { IdeasInput, IdeasOutput } from "@/lib/ai/schemas/ideas";
import { BrandVoiceToggle } from "../brand-voice-toggle";
import { EmptyState } from "../empty-state";
import { FormField } from "../form-field";
import { IdeaCard } from "./idea-card";

type Form = {
  niche: string;
  platform: IdeasInput["platform"];
  audience: string;
  goal: IdeasInput["goal"];
  topic: string;
  useBrandVoice: boolean;
};

const INITIAL: Form = {
  niche: "",
  platform: "TikTok",
  audience: "",
  goal: "grow",
  topic: "",
  useBrandVoice: true,
};

const EXAMPLES: { label: string; form: Partial<Form> }[] = [
  {
    label: "Fitness tips for busy moms on TikTok",
    form: { niche: "Home fitness", audience: "Busy moms with young kids", platform: "TikTok" },
  },
  {
    label: "Budget travel in Southeast Asia for YouTube",
    form: { niche: "Budget travel", audience: "Backpackers in their 20s", platform: "YouTube" },
  },
  {
    label: "Productivity hacks for remote developers on Instagram",
    form: {
      niche: "Productivity",
      audience: "Remote software developers",
      platform: "Instagram Reels",
    },
  },
];

const IDEA_COUNT = 10;

export function IdeasTool() {
  const [form, setForm] = usePersistentState<Form>(DRAFT_KEYS.ideas, INITIAL);
  const [submitted, setSubmitted] = useState<IdeasInput | null>(null);
  const { onError, paywall } = usePaywall();
  const gen = useGeneration<IdeasOutput>("ideas", {
    onError,
  });

  const update = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  function generate() {
    const input: IdeasInput = {
      niche: form.niche,
      platform: form.platform,
      audience: form.audience,
      goal: form.goal,
      topic: form.topic || undefined,
    };
    setSubmitted(input);
    void gen.start({ input, useBrandVoice: form.useBrandVoice });
  }

  const streaming = gen.status === "streaming";
  const ideas = asArray(asRecord(gen.partial).ideas).map(asRecord);
  const showSkeletons = streaming ? Math.max(0, Math.min(3, IDEA_COUNT - ideas.length)) : 0;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <form
        className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start"
        onSubmit={(e) => {
          e.preventDefault();
          if (!streaming) generate();
        }}
        aria-label="Idea generator"
      >
        <FormField id="niche" label="Niche">
          <Input
            id="niche"
            required
            minLength={2}
            maxLength={120}
            placeholder="e.g. Home fitness"
            value={form.niche}
            onChange={(e) => update("niche", e.target.value)}
          />
        </FormField>
        <FormField id="audience" label="Audience">
          <Input
            id="audience"
            required
            minLength={2}
            maxLength={200}
            placeholder="e.g. Busy moms with young kids"
            value={form.audience}
            onChange={(e) => update("audience", e.target.value)}
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
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </NativeSelect>
          </FormField>
          <FormField id="goal" label="Goal">
            <NativeSelect
              id="goal"
              value={form.goal}
              onChange={(e) => update("goal", e.target.value as Form["goal"])}
            >
              {GOALS.map((g) => (
                <option key={g} value={g}>
                  {GOAL_LABELS[g]}
                </option>
              ))}
            </NativeSelect>
          </FormField>
        </div>
        <FormField id="topic" label="Trend or topic (optional)">
          <Input
            id="topic"
            maxLength={200}
            placeholder="e.g. 75 Hard challenge"
            value={form.topic}
            onChange={(e) => update("topic", e.target.value)}
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
            Generate 10 ideas
          </Button>
        )}
      </form>

      <section
        aria-label="Generated ideas"
        aria-live="polite"
        aria-busy={streaming}
        className="flex flex-col gap-4"
      >
        <GenerationErrorAlert error={gen.error} onRetry={generate} />
        {gen.status === "idle" && (
          <EmptyState
            title="Describe your channel and get 10 ideas with hooks."
            examples={EXAMPLES.map((e) => e.label)}
            onSelectExample={(label) => {
              const ex = EXAMPLES.find((e) => e.label === label);
              if (ex) setForm((f) => ({ ...f, ...ex.form }));
            }}
          />
        )}
        {streaming && ideas.length === 0 && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Brainstorming ideas…
          </p>
        )}
        <div className="grid gap-4 xl:grid-cols-2">
          {ideas.map((idea, i) => (
            <IdeaCard
              key={i}
              index={i}
              idea={idea}
              complete={gen.status === "done" || i < ideas.length - 1}
              actionsEnabled={gen.status === "done"}
              context={submitted}
              parentGenerationId={gen.generationId}
            />
          ))}
          {Array.from({ length: showSkeletons }, (_, i) => (
            <Skeleton key={`s${i}`} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      </section>

      {paywall}
    </div>
  );
}
