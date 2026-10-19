"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { getSessionUserId } from "@/lib/auth";
import {
  deleteSavedItem,
  duplicateSavedItem,
  setFavorite,
  setTags,
} from "@/lib/db/queries/saved-items";

export type LibraryActionResult = { ok: true } | { ok: false; error: string };

const id = z.uuid();
const tagsSchema = z
  .array(z.string().trim().toLowerCase().min(1).max(40))
  .max(10)
  .transform((t) => [...new Set(t)]);

async function withUser(fn: (userId: string) => Promise<boolean>): Promise<LibraryActionResult> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "Please sign in again." };
  const ok = await fn(userId);
  if (!ok) return { ok: false, error: "That item no longer exists." };
  refresh();
  return { ok: true };
}

export async function toggleFavoriteAction(
  itemId: string,
  value: boolean,
): Promise<LibraryActionResult> {
  if (!id.safeParse(itemId).success) return { ok: false, error: "Invalid item." };
  return withUser((userId) => setFavorite(userId, itemId, Boolean(value)));
}

export async function setTagsAction(itemId: string, tags: string[]): Promise<LibraryActionResult> {
  const parsed = tagsSchema.safeParse(tags);
  if (!id.safeParse(itemId).success || !parsed.success) {
    return { ok: false, error: "Tags must be 40 characters or fewer, up to 10 per item." };
  }
  return withUser((userId) => setTags(userId, itemId, parsed.data));
}

export async function duplicateItemAction(itemId: string): Promise<LibraryActionResult> {
  if (!id.safeParse(itemId).success) return { ok: false, error: "Invalid item." };
  return withUser(async (userId) => (await duplicateSavedItem(userId, itemId)) !== null);
}

export async function deleteItemAction(itemId: string): Promise<LibraryActionResult> {
  if (!id.safeParse(itemId).success) return { ok: false, error: "Invalid item." };
  return withUser((userId) => deleteSavedItem(userId, itemId));
}
