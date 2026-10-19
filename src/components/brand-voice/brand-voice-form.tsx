"use client";

import { ChevronDown, Loader2, Save } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { saveBrandVoice } from "@/lib/actions/brand-voice";
import { buildBrandVoiceBlock } from "@/lib/ai/brand-voice";
import type { BrandVoiceInput } from "@/lib/brand-voice/schema";
import {
  AudienceAndToneFields,
  NicheAndPlatformsFields,
  toBrandVoice,
  WordsAndExampleFields,
} from "./brand-voice-fields";

export function BrandVoiceForm({ initial }: { initial: BrandVoiceInput }) {
  const [value, setValue] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [pending, start] = useTransition();
  const onChange = (patch: Partial<BrandVoiceInput>) => {
    setValue((v) => ({ ...v, ...patch }));
    setDirty(true);
  };
  const preview = buildBrandVoiceBlock(toBrandVoice(value));

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await saveBrandVoice(value);
          if (res.ok) {
            setDirty(false);
            toast.success("Brand voice saved — it'll be used in every generation");
          } else toast.error(res.error);
        });
      }}
    >
      <section className="flex flex-col gap-4" aria-labelledby="bv-s1">
        <h2 id="bv-s1" className="font-medium">
          Niche & platforms
        </h2>
        <NicheAndPlatformsFields value={value} onChange={onChange} />
      </section>
      <Separator />
      <section className="flex flex-col gap-4" aria-labelledby="bv-s2">
        <h2 id="bv-s2" className="font-medium">
          Audience & tone
        </h2>
        <AudienceAndToneFields value={value} onChange={onChange} />
      </section>
      <Separator />
      <section className="flex flex-col gap-4" aria-labelledby="bv-s3">
        <h2 id="bv-s3" className="font-medium">
          Words & examples
        </h2>
        <WordsAndExampleFields value={value} onChange={onChange} />
      </section>

      <details className="group rounded-lg border p-4 text-sm">
        <summary className="flex cursor-pointer list-none items-center gap-2 font-medium">
          <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
          What gets added to your prompts
        </summary>
        <pre className="mt-3 overflow-x-auto font-mono text-xs whitespace-pre-wrap text-muted-foreground">
          {preview ?? "Nothing yet — fill in at least one field."}
        </pre>
      </details>

      <div className="sticky bottom-0 -mx-1 flex items-center gap-3 bg-background/80 px-1 py-3 backdrop-blur">
        <Button type="submit" disabled={pending || !dirty}>
          {pending ? <Loader2 className="animate-spin" /> : <Save />}
          Save brand voice
        </Button>
        {dirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
      </div>
    </form>
  );
}
