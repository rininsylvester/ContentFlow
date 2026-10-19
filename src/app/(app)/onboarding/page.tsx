import { OnboardingWizard } from "@/components/brand-voice/onboarding-wizard";

export const metadata = { title: "Welcome" };

export default function OnboardingPage() {
  return (
    <div className="mx-auto max-w-xl pt-4 sm:pt-8">
      <OnboardingWizard />
    </div>
  );
}
