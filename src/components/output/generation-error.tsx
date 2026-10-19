"use client";

import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GenerationError } from "@/hooks/use-generation";

const PAYWALL_CODES = new Set(["trial_exhausted", "cap_reached"]);

/** Inline error with a retry button. Paywall errors are shown by <PaywallDialog> instead. */
export function GenerationErrorAlert({
  error,
  onRetry,
}: {
  error: GenerationError | undefined;
  onRetry?: () => void;
}) {
  if (!error || PAYWALL_CODES.has(error.code)) return null;
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm sm:flex-row sm:items-center"
    >
      <AlertCircle className="size-4 shrink-0 text-destructive" aria-hidden />
      <p className="flex-1">{error.message}</p>
      {onRetry && error.code !== "not_configured" && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          <RotateCcw />
          Try again
        </Button>
      )}
    </div>
  );
}

export function isPaywallError(error: GenerationError | undefined): boolean {
  return Boolean(error && PAYWALL_CODES.has(error.code));
}
