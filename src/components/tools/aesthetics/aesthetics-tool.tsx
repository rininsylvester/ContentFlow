"use client";

import { usePaywall } from "@/components/billing/use-paywall";
import { CopyButton } from "@/components/output/copy-button";
import { GenerationErrorAlert } from "@/components/output/generation-error";
import { ResultCard } from "@/components/output/result-card";
import { SaveButton } from "@/components/output/save-button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { usePersistentState } from "@/hooks/use-persistent-state";
import { useGeneration } from "@/hooks/use-generation";
import { PLATFORMS } from "@/lib/ai/options";
import { asArray, asRecord, asString, asStringArray } from "@/lib/ai/partial";
import type { AestheticsInput, AestheticsOutput } from "@/lib/ai/schemas/aesthetics";
import { parseHex, readableTextColor } from "@/lib/color";
import { fontStack, googleFontHref } from "@/lib/fonts";
import { BrandVoiceToggle } from "../brand-voice-toggle";
import { EmptyState } from "../empty-state";
import { FormField } from "../form-field";
import { GenerateButton, StreamingNotice, ToolWorkspace } from "../tool-workspace";

type Form = {
  niche: string;
  vibe: string;
  platform: AestheticsInput["platform"];
  useBrandVoice: boolean;
};
const INITIAL: Form = { niche: "", vibe: "", platform: "YouTube", useBrandVoice: true };

const EXAMPLES: { label: string; form: Partial<Form> }[] = [
  {
    label: "Cozy, warm, film-grain — cooking channel on YouTube",
    form: { niche: "Home cooking", vibe: "Cozy, warm, film-grain", platform: "YouTube" },
  },
  {
    label: "Bold, neon, high-energy — gaming on TikTok",
    form: { niche: "Gaming", vibe: "Bold, neon, high-energy", platform: "TikTok" },
  },
  {
    label: "Calm, airy, neutral — wellness on Instagram",
    form: { niche: "Wellness", vibe: "Calm, airy, neutral", platform: "Instagram" },
  },
];

type Swatch = { hex: string; name: string; role: string };

function Swatches({ palette }: { palette: Swatch[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-5" aria-label="Color palette">
      {palette.map((c, i) => (
        <li key={`${c.hex}-${i}`} className="overflow-hidden rounded-lg border">
          <div
            className="flex h-24 items-end justify-end p-1.5"
            style={{ backgroundColor: c.hex, color: readableTextColor(c.hex) }}
          >
            <CopyButton
              text={c.hex}
              label={`Copy ${c.name || "color"} ${c.hex}`}
              className="text-current hover:bg-black/10"
            />
          </div>
          <div className="space-y-0.5 p-2.5 text-xs">
            <p className="font-medium">{c.name}</p>
            <p className="font-mono text-muted-foreground uppercase">{c.hex}</p>
            {c.role && <p className="text-muted-foreground capitalize">{c.role}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}

function FontPreview({ heading, body, why }: { heading: string; body: string; why: string }) {
  const headingHref = googleFontHref(heading);
  const bodyHref = googleFontHref(body);
  return (
    <li className="rounded-lg border p-4">
      {/* React hoists stylesheet links into <head> and dedupes them by href. */}
      {headingHref && <link rel="stylesheet" href={headingHref} precedence="fonts" />}
      {bodyHref && <link rel="stylesheet" href={bodyHref} precedence="fonts" />}
      <p className="text-2xl leading-tight" style={{ fontFamily: fontStack(heading, "serif") }}>
        The quick brown fox
      </p>
      <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: fontStack(body) }}>
        Pack my box with five dozen liquor jugs. 0123456789
      </p>
      <p className="mt-3 text-xs">
        <span className="font-medium">{heading}</span> + <span className="font-medium">{body}</span>
        {why && <span className="text-muted-foreground"> — {why}</span>}
      </p>
    </li>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm">
      {items.map((t, i) => (
        <li key={i}>{t}</li>
      ))}
    </ul>
  );
}

export function AestheticsTool() {
  const [form, setForm] = usePersistentState<Form>("creatorhub:draft:aesthetics", INITIAL);
  const { onError, paywall } = usePaywall();
  const gen = useGeneration<AestheticsOutput>("aesthetics", { onError });
  const update = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  function generate() {
    void gen.start({
      input: { niche: form.niche, vibe: form.vibe, platform: form.platform },
      useBrandVoice: form.useBrandVoice,
    });
  }

  const streaming = gen.status === "streaming";
  const d = asRecord(gen.partial);
  const palette = asArray(d.palette)
    .map(asRecord)
    .map((c) => ({ hex: asString(c.hex), name: asString(c.name), role: asString(c.role) }))
    .filter((c) => parseHex(c.hex));
  const fonts = asArray(d.fontPairings)
    .map(asRecord)
    .map((f) => ({ heading: asString(f.heading), body: asString(f.body), why: asString(f.why) }))
    .filter((f) => f.heading && f.body);
  const thumbnails = asArray(d.thumbnails).map(asRecord);
  const shots = asArray(d.shotList).map(asRecord);
  const headingFont = fonts[0]?.heading ?? "";
  const bg = palette.find((c) => /background/i.test(c.role))?.hex ?? palette[0]?.hex ?? "#111111";
  const accent =
    palette.find((c) => /accent|primary|highlight/i.test(c.role))?.hex ??
    palette[1]?.hex ??
    "#FFFFFF";

  return (
    <>
      <ToolWorkspace
        formLabel="Aesthetics studio"
        resultsLabel="Visual direction"
        busy={streaming}
        onSubmit={generate}
        form={
          <>
            <FormField id="niche" label="Niche">
              <Input
                id="niche"
                required
                minLength={2}
                maxLength={120}
                placeholder="e.g. Home cooking"
                value={form.niche}
                onChange={(e) => update("niche", e.target.value)}
              />
            </FormField>
            <FormField
              id="vibe"
              label="Vibe words"
              hint="Three to five words that describe the feel."
            >
              <Input
                id="vibe"
                required
                minLength={2}
                maxLength={200}
                placeholder="e.g. Cozy, warm, film-grain"
                aria-describedby="vibe-hint"
                value={form.vibe}
                onChange={(e) => update("vibe", e.target.value)}
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
              Create visual direction
            </GenerateButton>
          </>
        }
        results={
          <>
            <GenerationErrorAlert error={gen.error} onRetry={generate} />
            {gen.status === "idle" && (
              <EmptyState
                title="Get a palette, font pairings, mood, lighting, thumbnails and a shot list."
                examples={EXAMPLES.map((e) => e.label)}
                onSelectExample={(label) => {
                  const ex = EXAMPLES.find((e) => e.label === label);
                  if (ex) setForm((f) => ({ ...f, ...ex.form }));
                }}
              />
            )}
            {streaming && palette.length === 0 && (
              <StreamingNotice>Building your visual direction…</StreamingNotice>
            )}
            {palette.length > 0 && (
              <ResultCard
                title="Color palette"
                copyText={palette.map((c) => c.hex).join(", ")}
                actions={
                  gen.status === "done" && gen.output ? (
                    <SaveButton
                      tool="aesthetics"
                      title={`Aesthetics: ${form.niche} — ${form.vibe}`.slice(0, 300)}
                      content={{ ...gen.output, niche: form.niche, vibe: form.vibe }}
                      generationId={gen.generationId}
                    />
                  ) : null
                }
              >
                <Swatches palette={palette} />
              </ResultCard>
            )}
            {fonts.length > 0 && (
              <ResultCard title="Font pairings (Google Fonts)">
                <ul className="grid gap-3 md:grid-cols-2">
                  {fonts.map((f, i) => (
                    <FontPreview key={`${f.heading}-${f.body}-${i}`} {...f} />
                  ))}
                </ul>
              </ResultCard>
            )}
            {asString(d.visualStyle) && (
              <ResultCard title="Visual style & mood" copyText={asString(d.visualStyle)}>
                <p className="text-sm">{asString(d.visualStyle)}</p>
              </ResultCard>
            )}
            {(asStringArray(d.lighting).length > 0 || asStringArray(d.camera).length > 0) && (
              <div className="grid gap-4 md:grid-cols-2">
                <ResultCard title="Lighting" copyText={asStringArray(d.lighting).join("\n")}>
                  <List items={asStringArray(d.lighting)} />
                </ResultCard>
                <ResultCard title="Camera" copyText={asStringArray(d.camera).join("\n")}>
                  <List items={asStringArray(d.camera)} />
                </ResultCard>
              </div>
            )}
            {thumbnails.length > 0 && (
              <ResultCard title="Thumbnail concepts">
                <ul className="grid gap-4 md:grid-cols-2">
                  {thumbnails.map((t, i) => (
                    <li key={i} className="space-y-2">
                      <div
                        className="flex aspect-video items-center justify-center rounded-lg border p-4 text-center"
                        style={{ backgroundColor: bg }}
                        aria-hidden
                      >
                        <span
                          className="text-2xl leading-tight font-bold uppercase"
                          style={{ color: accent, fontFamily: fontStack(headingFont, "serif") }}
                        >
                          {asString(t.text)}
                        </span>
                      </div>
                      <dl className="space-y-1 text-sm">
                        <div>
                          <dt className="inline font-medium">{asString(t.concept)}: </dt>
                          <dd className="inline text-muted-foreground">{asString(t.layout)}</dd>
                        </div>
                        {asString(t.expression) && (
                          <div>
                            <dt className="inline font-medium">Expression: </dt>
                            <dd className="inline text-muted-foreground">
                              {asString(t.expression)}
                            </dd>
                          </div>
                        )}
                        {asString(t.contrast) && (
                          <div>
                            <dt className="inline font-medium">Contrast: </dt>
                            <dd className="inline text-muted-foreground">{asString(t.contrast)}</dd>
                          </div>
                        )}
                      </dl>
                    </li>
                  ))}
                </ul>
              </ResultCard>
            )}
            {shots.length > 0 && (
              <ResultCard
                title="Shot list"
                copyText={shots
                  .map((s, i) => `${i + 1}. ${asString(s.shot)} — ${asString(s.purpose)}`)
                  .join("\n")}
              >
                <ol className="space-y-2 text-sm">
                  {shots.map((s, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="font-mono text-xs text-muted-foreground tabular-nums">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span>
                        <span className="font-medium">{asString(s.shot)}</span>
                        {asString(s.purpose) && (
                          <span className="text-muted-foreground"> — {asString(s.purpose)}</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ol>
              </ResultCard>
            )}
          </>
        }
      />
      {paywall}
    </>
  );
}
