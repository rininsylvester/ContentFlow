import { UserRound } from "lucide-react";
import { EmptyState } from "@/components/tools/empty-state";
import { ToolHeader } from "@/components/tools/tool-header";

export const metadata = { title: "Brand voice" };

export default function BrandVoicePage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <ToolHeader
        item={{
          label: "Brand voice",
          description: "Your niche, audience and tone — added to every generation automatically.",
          icon: UserRound,
        }}
      />
      <EmptyState title="Brand voice settings arrive in Phase 4." />
    </div>
  );
}
