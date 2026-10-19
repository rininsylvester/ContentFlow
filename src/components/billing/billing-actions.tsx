"use client";

import { CreditCard, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { PLAN } from "@/lib/billing/plan";

function Submit({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant?: "default" | "outline";
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : null}
      {children}
    </Button>
  );
}

/** Plain form POSTs: the route handlers answer with a 303 redirect to Stripe. */
export function SubscribeButton({ label }: { label?: string }) {
  return (
    <form action="/api/stripe/checkout" method="post">
      <Submit>
        <Sparkles />
        {label ?? `Subscribe for $${PLAN.priceUsdMonthly}/month`}
      </Submit>
    </form>
  );
}

export function ManageBillingButton() {
  return (
    <form action="/api/stripe/portal" method="post">
      <Submit variant="outline">
        <CreditCard />
        Manage billing
        <ExternalLink className="size-3.5 opacity-60" />
      </Submit>
    </form>
  );
}
