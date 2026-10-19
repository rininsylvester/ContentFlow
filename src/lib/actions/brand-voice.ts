"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { brandVoiceSchema, type BrandVoiceInput } from "@/lib/brand-voice/schema";
import { upsertBrandProfile } from "@/lib/db/queries/brand-profiles";
import { markOnboarded } from "@/lib/db/queries/users";

export type ActionResult = { ok: true } | { ok: false; error: string };

const INVALID = "Some fields are too long. Shorten them and try again.";

export async function saveBrandVoice(raw: BrandVoiceInput): Promise<ActionResult> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "Please sign in again." };

  const parsed = brandVoiceSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: INVALID };

  await upsertBrandProfile(userId, parsed.data);
  refresh();
  return { ok: true };
}

/** Finish (with a profile) or skip (null) onboarding, then go to the Idea Generator. */
export async function completeOnboarding(raw: BrandVoiceInput | null): Promise<ActionResult> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "Please sign in again." };

  if (raw) {
    const parsed = brandVoiceSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: INVALID };
    await upsertBrandProfile(userId, parsed.data);
  }
  await markOnboarded(userId);
  redirect("/ideas");
}
