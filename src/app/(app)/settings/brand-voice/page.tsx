import { UserRound } from "lucide-react";
import { Suspense } from "react";
import { BrandVoiceForm } from "@/components/brand-voice/brand-voice-form";
import { ToolHeader } from "@/components/tools/tool-header";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/lib/auth";
import { profileToInput } from "@/lib/brand-voice/from-profile";
import { getBrandProfile } from "@/lib/db/queries/brand-profiles";

export const metadata = { title: "Brand voice" };

async function BrandVoiceLoader() {
  const user = await getCurrentUser();
  return <BrandVoiceForm initial={profileToInput(await getBrandProfile(user.id))} />;
}

export default function BrandVoicePage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <ToolHeader
        item={{
          label: "Brand voice",
          description:
            "Your niche, audience and tone are added to every generation automatically. Turn it off for a single generation with the toggle on each tool.",
          icon: UserRound,
        }}
      />
      <Suspense fallback={<Skeleton className="h-[640px] w-full" />}>
        <BrandVoiceLoader />
      </Suspense>
    </div>
  );
}
