"use client";

import { useCallback, useState } from "react";
import type { GenerationError } from "@/hooks/use-generation";
import { PaywallDialog } from "./paywall-dialog";

type Reason = "trial_exhausted" | "cap_reached";

/** Pass `onError` to useGeneration and render `paywall` once in the tool. */
export function usePaywall() {
  const [reason, setReason] = useState<Reason | null>(null);

  const onError = useCallback((error: GenerationError) => {
    if (error.code === "trial_exhausted" || error.code === "cap_reached") setReason(error.code);
  }, []);

  const paywall = reason ? (
    <PaywallDialog open onOpenChange={(open) => !open && setReason(null)} reason={reason} />
  ) : null;

  return { onError, paywall };
}
