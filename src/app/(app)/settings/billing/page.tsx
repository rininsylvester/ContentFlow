import { AlertTriangle, Check, CircleCheck, CreditCard, Info } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { ManageBillingButton, SubscribeButton } from "@/components/billing/billing-actions";
import { UsageMeter } from "@/components/shell/usage-meter";
import { ToolHeader } from "@/components/tools/tool-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/lib/auth";
import { PLAN } from "@/lib/billing/plan";
import { hasActiveSubscription } from "@/lib/billing/usage-summary";
import { getUsageSummary } from "@/lib/db/queries/usage";

export const metadata = { title: "Billing" };

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

const FEATURES = [
  `${PLAN.monthlyGenerationCap} generations every month`,
  "Idea Generator, Script Writer, Hook Lab, SEO, Aesthetics and Repurposer",
  "Brand voice in every generation",
  "Library and content calendar",
  "Cancel anytime from the billing portal",
];

function Notice({
  tone,
  children,
}: {
  tone: "success" | "warning" | "info";
  children: React.ReactNode;
}) {
  const Icon = tone === "success" ? CircleCheck : tone === "warning" ? AlertTriangle : Info;
  const styles = {
    success: "border-success/40 bg-success/10",
    warning: "border-warning/40 bg-warning/10",
    info: "border-border bg-muted/50",
  }[tone];
  return (
    <div role="status" className={`flex items-start gap-3 rounded-lg border p-4 text-sm ${styles}`}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="space-y-2">{children}</div>
    </div>
  );
}

async function BillingDetails({
  searchParams,
}: {
  searchParams: PageProps<"/settings/billing">["searchParams"];
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const usage = await getUsageSummary(user);
  const active = hasActiveSubscription(user.subscriptionStatus, user.currentPeriodEnd);
  const periodEnd = user.currentPeriodEnd ? dateFormat.format(user.currentPeriodEnd) : null;

  return (
    <div className="flex flex-col gap-6">
      {params.checkout === "success" &&
        (active ? (
          <Notice tone="success">
            <p className="font-medium">You&apos;re subscribed — thank you!</p>
            <p>You now have {PLAN.monthlyGenerationCap} generations a month.</p>
          </Notice>
        ) : (
          <Notice tone="info">
            <p>
              Payment received. Your subscription is being activated — this usually takes a few
              seconds.
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href="/settings/billing?checkout=success">Refresh</Link>
            </Button>
          </Notice>
        ))}
      {params.checkout === "canceled" && (
        <Notice tone="info">Checkout canceled. You haven&apos;t been charged.</Notice>
      )}
      {params.error && (
        <Notice tone="warning">
          We couldn&apos;t reach the payment provider. Please try again in a moment.
        </Notice>
      )}
      {user.subscriptionStatus === "past_due" && (
        <Notice tone="warning">
          <p className="font-medium">Your last payment failed.</p>
          <p>
            You still have access while we retry. Update your payment method to avoid losing it.
          </p>
        </Notice>
      )}

      {active ? (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>{PLAN.name}</CardTitle>
              <Badge
                variant="outline"
                className={
                  user.cancelAtPeriodEnd ? "text-warning" : "border-success/40 text-success"
                }
              >
                {user.cancelAtPeriodEnd
                  ? "Cancels at period end"
                  : user.subscriptionStatus === "past_due"
                    ? "Past due"
                    : "Active"}
              </Badge>
            </div>
            <CardDescription>
              ${PLAN.priceUsdMonthly}/month
              {periodEnd &&
                (user.cancelAtPeriodEnd
                  ? ` · access until ${periodEnd}`
                  : ` · renews ${periodEnd}`)}
            </CardDescription>
          </CardHeader>
          <CardContent className="max-w-sm">
            <UsageMeter usage={usage} />
          </CardContent>
          <CardFooter>
            <ManageBillingButton />
          </CardFooter>
        </Card>
      ) : (
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>{PLAN.name}</CardTitle>
            <CardDescription>
              <span className="text-3xl font-semibold text-foreground">
                ${PLAN.priceUsdMonthly}
              </span>{" "}
              / month
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <ul className="space-y-2 text-sm">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
            <UsageMeter usage={usage} />
          </CardContent>
          <CardFooter className="flex flex-wrap gap-2">
            <SubscribeButton />
            {user.stripeCustomerId && <ManageBillingButton />}
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

export default function BillingPage({ searchParams }: PageProps<"/settings/billing">) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <ToolHeader
        item={{
          label: "Billing",
          description: "Your plan, usage and payment details.",
          icon: CreditCard,
        }}
      />
      <Suspense fallback={<Skeleton className="h-80 w-full rounded-xl" />}>
        <BillingDetails searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
