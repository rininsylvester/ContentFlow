import { CreditCard } from "lucide-react";
import { EmptyState } from "@/components/tools/empty-state";
import { ToolHeader } from "@/components/tools/tool-header";

export const metadata = { title: "Billing" };

export default function BillingPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <ToolHeader
        item={{
          label: "Billing",
          description: "Manage your $5/month subscription and see your usage.",
          icon: CreditCard,
        }}
      />
      <EmptyState title="Subscriptions and the billing portal arrive in Phase 5." />
    </div>
  );
}
