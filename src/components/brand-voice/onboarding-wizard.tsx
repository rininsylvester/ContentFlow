"use client";

import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { usePersistentState } from "@/hooks/use-persistent-state";
import { completeOnboarding } from "@/lib/actions/brand-voice";
import { EMPTY_BRAND_VOICE, type BrandVoiceInput } from "@/lib/brand-voice/schema";
import { cn } from "@/lib/utils";
import {
  AudienceAndToneFields,
  NicheAndPlatformsFields,
  WordsAndExampleFields,
} from "./brand-voice-fields";

const STEPS = [
  {
    title: "What do you create?",
    description: "Your niche and the platforms you post on.",
    Fields: NicheAndPlatformsFields,
  },
  {
    title: "Who is it for?",
    description: "Your audience and the tone you use with them.",
    Fields: AudienceAndToneFields,
  },
  {
    title: "How do you sound?",
    description: "Words you love, words you avoid, and an example.",
    Fields: WordsAndExampleFields,
  },
] as const;

export function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [value, setValue] = usePersistentState<BrandVoiceInput>(
    "creatorhub:draft:onboarding",
    EMPTY_BRAND_VOICE,
  );
  const [pending, start] = useTransition();
  const current = STEPS[step]!;
  const last = step === STEPS.length - 1;

  function finish(withProfile: boolean) {
    start(async () => {
      const res = await completeOnboarding(withProfile ? value : null);
      // On success the action redirects, so we only get here on failure.
      if (res && !res.ok) toast.error(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-3 text-center">
        <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="size-5" aria-hidden />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">Set up your brand voice</h1>
        <p className="text-sm text-muted-foreground">
          Every generation will sound like you. It takes a minute, and you can change it anytime in
          Settings.
        </p>
      </div>

      <ol className="flex items-center justify-center gap-2" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex items-center gap-2">
            <span
              aria-current={i === step ? "step" : undefined}
              className={cn(
                "flex size-7 items-center justify-center rounded-full border text-xs font-medium",
                i < step && "border-primary bg-primary text-primary-foreground",
                i === step && "border-primary text-primary",
                i > step && "text-muted-foreground",
              )}
            >
              {i < step ? <Check className="size-3.5" aria-hidden /> : i + 1}
              <span className="sr-only">
                {s.title} {i < step ? "(done)" : i === step ? "(current)" : ""}
              </span>
            </span>
            {i < STEPS.length - 1 && (
              <span className={cn("h-px w-8", i < step ? "bg-primary" : "bg-border")} />
            )}
          </li>
        ))}
      </ol>

      <form
        className="flex flex-col gap-5 rounded-xl border bg-card p-6 shadow-sm"
        aria-labelledby="onboarding-step-title"
        onSubmit={(e) => {
          e.preventDefault();
          if (last) finish(true);
          else setStep((s) => s + 1);
        }}
      >
        <div>
          <h2 id="onboarding-step-title" className="font-semibold">
            Step {step + 1} of {STEPS.length}: {current.title}
          </h2>
          <p className="text-sm text-muted-foreground">{current.description}</p>
        </div>
        <current.Fields value={value} onChange={(patch) => setValue((v) => ({ ...v, ...patch }))} />
        <div className="flex flex-wrap items-center gap-2 pt-2">
          {step > 0 && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep((s) => s - 1)}
              disabled={pending}
            >
              <ArrowLeft />
              Back
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            className="ml-auto text-muted-foreground"
            onClick={() => finish(false)}
            disabled={pending}
          >
            Skip for now
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : last ? <Check /> : <ArrowRight />}
            {last ? "Finish" : "Next"}
          </Button>
        </div>
      </form>
    </div>
  );
}
