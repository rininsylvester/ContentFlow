"use client";

import { Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PLAN } from "@/lib/billing/plan";

const FEATURES = [
  `${PLAN.monthlyGenerationCap} generations every month`,
  "All tools: ideas, scripts, hooks, SEO, aesthetics, repurposing",
  "Brand voice, library and content calendar",
  "Cancel anytime",
];

export function PaywallDialog({
  open,
  onOpenChange,
  reason,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason: "trial_exhausted" | "cap_reached";
}) {
  const capReached = reason === "cap_reached";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <span className="mb-1 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="size-5" aria-hidden />
          </span>
          <DialogTitle>
            {capReached ? "You've hit this month's limit" : "You've used your free generations"}
          </DialogTitle>
          <DialogDescription>
            {capReached
              ? "Your allowance resets at the start of your next billing period. Your input is saved."
              : `Keep creating with ${PLAN.name} for $${PLAN.priceUsdMonthly}/month. Your input is saved.`}
          </DialogDescription>
        </DialogHeader>
        {!capReached && (
          <ul className="space-y-2 text-sm">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2">
                <Check className="size-4 text-primary" aria-hidden />
                {f}
              </li>
            ))}
          </ul>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Not now
          </Button>
          {!capReached && (
            <Button asChild>
              <Link href="/settings/billing">Subscribe for ${PLAN.priceUsdMonthly}/month</Link>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
