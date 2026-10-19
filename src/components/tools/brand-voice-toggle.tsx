"use client";

import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function BrandVoiceToggle({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <Switch id="use-brand-voice" checked={checked} onCheckedChange={onCheckedChange} />
      <Label htmlFor="use-brand-voice" className="font-normal">
        Use my brand voice
      </Label>
      <Link
        href="/settings/brand-voice"
        className="text-xs text-muted-foreground underline-offset-4 hover:underline"
      >
        Edit
      </Link>
    </div>
  );
}
