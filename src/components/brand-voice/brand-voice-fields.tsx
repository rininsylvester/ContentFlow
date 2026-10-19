"use client";

import { FormField } from "@/components/tools/form-field";
import { ChipsInput } from "@/components/ui/chips-input";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TONE_SUGGESTIONS } from "@/lib/ai/options";
import { BRAND_VOICE_LIMITS, type BrandVoiceInput } from "@/lib/brand-voice/schema";
import { PlatformPicker } from "./platform-picker";

type Props = {
  value: BrandVoiceInput;
  onChange: (patch: Partial<BrandVoiceInput>) => void;
};

/** Field groups shared by the settings form and the onboarding steps. */
export function NicheAndPlatformsFields({ value, onChange }: Props) {
  return (
    <>
      <FormField
        id="bv-niche"
        label="Your niche"
        hint="What your content is about, in a few words."
      >
        <Input
          id="bv-niche"
          maxLength={BRAND_VOICE_LIMITS.niche}
          placeholder="e.g. Budget home cooking"
          aria-describedby="bv-niche-hint"
          value={value.niche}
          onChange={(e) => onChange({ niche: e.target.value })}
        />
      </FormField>
      <div className="space-y-2">
        <p className="text-sm font-medium">Platforms you create for</p>
        <PlatformPicker value={value.platforms} onChange={(platforms) => onChange({ platforms })} />
      </div>
    </>
  );
}

export function AudienceAndToneFields({ value, onChange }: Props) {
  return (
    <>
      <FormField
        id="bv-audience"
        label="Your audience"
        hint="Who you're talking to and what they care about."
      >
        <Input
          id="bv-audience"
          maxLength={BRAND_VOICE_LIMITS.audience}
          placeholder="e.g. Students who want cheap, healthy meals"
          aria-describedby="bv-audience-hint"
          value={value.audience}
          onChange={(e) => onChange({ audience: e.target.value })}
        />
      </FormField>
      <FormField id="bv-tone" label="Your tone">
        <Input
          id="bv-tone"
          list="bv-tone-suggestions"
          maxLength={BRAND_VOICE_LIMITS.tone}
          placeholder="e.g. Friendly, a little sarcastic, no fluff"
          value={value.tone}
          onChange={(e) => onChange({ tone: e.target.value })}
        />
        <datalist id="bv-tone-suggestions">
          {TONE_SUGGESTIONS.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
      </FormField>
    </>
  );
}

export function WordsAndExampleFields({ value, onChange }: Props) {
  return (
    <>
      <FormField
        id="bv-use"
        label="Words and phrases to use"
        hint="Press Enter or comma after each one."
      >
        <ChipsInput
          id="bv-use"
          aria-describedby="bv-use-hint"
          placeholder="e.g. game-changer, let's go"
          max={BRAND_VOICE_LIMITS.words}
          maxLength={BRAND_VOICE_LIMITS.wordLength}
          value={value.wordsToUse}
          onChange={(wordsToUse) => onChange({ wordsToUse })}
        />
      </FormField>
      <FormField id="bv-avoid" label="Words and phrases to avoid">
        <ChipsInput
          id="bv-avoid"
          placeholder="e.g. hustle, guru"
          max={BRAND_VOICE_LIMITS.words}
          maxLength={BRAND_VOICE_LIMITS.wordLength}
          value={value.wordsToAvoid}
          onChange={(wordsToAvoid) => onChange({ wordsToAvoid })}
        />
      </FormField>
      <FormField
        id="bv-example"
        label="Example of your content (optional)"
        hint="Paste a caption, script excerpt or post that sounds like you."
      >
        <Textarea
          id="bv-example"
          rows={6}
          maxLength={BRAND_VOICE_LIMITS.example}
          aria-describedby="bv-example-hint"
          className="max-h-80"
          value={value.exampleContent}
          onChange={(e) => onChange({ exampleContent: e.target.value })}
        />
      </FormField>
    </>
  );
}

/** Convert form input into the shape the prompt builder expects. */
export function toBrandVoice(value: BrandVoiceInput) {
  return {
    niche: value.niche.trim() || null,
    audience: value.audience.trim() || null,
    tone: value.tone.trim() || null,
    wordsToUse: value.wordsToUse,
    wordsToAvoid: value.wordsToAvoid,
    exampleContent: value.exampleContent.trim() || null,
    platforms: value.platforms,
  };
}
