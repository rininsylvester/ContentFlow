"use client";

import { Loader2, Square, Wand2 } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { Button } from "@/components/ui/button";

/** Two-column tool layout: sticky form on the left, results on the right. */
export function ToolWorkspace({
  formLabel,
  onSubmit,
  form,
  results,
  resultsLabel,
  busy,
}: {
  formLabel: string;
  onSubmit: () => void;
  form: ReactNode;
  results: ReactNode;
  resultsLabel: string;
  busy: boolean;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <form
        className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start"
        aria-label={formLabel}
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          if (!busy) onSubmit();
        }}
      >
        {form}
      </form>
      <section
        aria-label={resultsLabel}
        aria-live="polite"
        aria-busy={busy}
        className="flex min-w-0 flex-col gap-4"
      >
        {results}
      </section>
    </div>
  );
}

export function GenerateButton({
  streaming,
  onStop,
  children,
}: {
  streaming: boolean;
  onStop: () => void;
  children: ReactNode;
}) {
  return streaming ? (
    <Button type="button" variant="outline" onClick={onStop}>
      <Square />
      Stop
    </Button>
  ) : (
    <Button type="submit">
      <Wand2 />
      {children}
    </Button>
  );
}

export function StreamingNotice({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" aria-hidden />
      {children}
    </p>
  );
}
