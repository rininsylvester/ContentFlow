"use client";

import { Check } from "lucide-react";
import { PLATFORMS, type Platform } from "@/lib/ai/options";
import { cn } from "@/lib/utils";

export function PlatformPicker({
  value,
  onChange,
}: {
  value: Platform[];
  onChange: (value: Platform[]) => void;
}) {
  return (
    <div role="group" aria-label="Platforms" className="flex flex-wrap gap-2">
      {PLATFORMS.map((p) => {
        const selected = value.includes(p);
        return (
          <button
            key={p}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(selected ? value.filter((v) => v !== p) : [...value, p])}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              selected
                ? "border-primary bg-primary/10 text-foreground"
                : "text-muted-foreground hover:bg-accent",
            )}
          >
            {selected && <Check className="size-3.5 text-primary" aria-hidden />}
            {p}
          </button>
        );
      })}
    </div>
  );
}
