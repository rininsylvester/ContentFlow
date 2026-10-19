"use server";

import { z } from "zod";
import { getSessionUserId } from "@/lib/auth";
import { TOOLS } from "@/lib/db/schema/enums";
import { isOwnGeneration } from "@/lib/db/queries/generations";
import { createSavedItem } from "@/lib/db/queries/saved-items";

const saveItemSchema = z.object({
  tool: z.enum(TOOLS),
  title: z.string().trim().min(1).max(300),
  content: z.record(z.string(), z.unknown()),
  generationId: z.uuid().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(10).optional(),
});

export type SaveItemResult = { ok: true; id: string } | { ok: false; error: string };

const MAX_CONTENT_BYTES = 100_000;

export async function saveItem(raw: z.input<typeof saveItemSchema>): Promise<SaveItemResult> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "Please sign in again." };

  const parsed = saveItemSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "That item couldn't be saved." };
  if (JSON.stringify(parsed.data.content).length > MAX_CONTENT_BYTES) {
    return { ok: false, error: "That item is too large to save." };
  }

  const { generationId, ...rest } = parsed.data;
  const ownGeneration = generationId ? await isOwnGeneration(userId, generationId) : false;

  const id = await createSavedItem({
    userId,
    ...rest,
    generationId: ownGeneration ? generationId : undefined,
  });
  return { ok: true, id };
}
