"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { getSessionUserId } from "@/lib/auth";
import { isISODate } from "@/lib/calendar/dates";
import {
  createEntry,
  deleteEntry,
  updateEntry,
  type CalendarEntryView,
} from "@/lib/db/queries/calendar";
import { getSavedItemSummary } from "@/lib/db/queries/saved-items";
import { CALENDAR_STATUSES } from "@/lib/db/schema";

export type CalendarActionResult<T = undefined> =
  ({ ok: true } & (T extends undefined ? object : { data: T })) | { ok: false; error: string };

const isoDate = z.string().refine(isISODate, "Invalid date");
const id = z.uuid();
const SIGN_IN = { ok: false, error: "Please sign in again." } as const;
const INVALID = { ok: false, error: "Check the entry details and try again." } as const;

const createSchema = z.object({
  title: z.string().trim().min(1).max(300),
  scheduledDate: isoDate,
  platform: z.string().trim().max(40).optional(),
});

const patchSchema = z
  .object({
    title: z.string().trim().min(1).max(300),
    scheduledDate: isoDate,
    status: z.enum(CALENDAR_STATUSES),
    platform: z
      .string()
      .trim()
      .max(40)
      .transform((v) => v || null)
      .nullable(),
    notes: z
      .string()
      .trim()
      .max(2000)
      .transform((v) => v || null)
      .nullable(),
    position: z.number().int().min(0).max(10_000),
  })
  .partial();

export async function createEntryAction(
  raw: z.input<typeof createSchema>,
): Promise<CalendarActionResult<CalendarEntryView>> {
  const userId = await getSessionUserId();
  if (!userId) return SIGN_IN;
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) return INVALID;
  const entry = await createEntry({ userId, ...parsed.data });
  refresh();
  return { ok: true, data: entry };
}

/** Schedule a saved idea or script (drag from the side panel, or "Add to calendar" in the library). */
export async function scheduleSavedItemAction(
  savedItemId: string,
  scheduledDate: string,
): Promise<CalendarActionResult<CalendarEntryView>> {
  const userId = await getSessionUserId();
  if (!userId) return SIGN_IN;
  if (!id.safeParse(savedItemId).success || !isISODate(scheduledDate)) return INVALID;

  const item = await getSavedItemSummary(userId, savedItemId);
  if (!item) return { ok: false, error: "That saved item no longer exists." };

  const entry = await createEntry({
    userId,
    savedItemId,
    title: item.title,
    scheduledDate,
    status: item.tool === "script" ? "scripted" : "idea",
  });
  refresh();
  return { ok: true, data: entry };
}

export async function updateEntryAction(
  entryId: string,
  raw: z.input<typeof patchSchema>,
): Promise<CalendarActionResult<CalendarEntryView>> {
  const userId = await getSessionUserId();
  if (!userId) return SIGN_IN;
  const parsed = patchSchema.safeParse(raw);
  if (!id.safeParse(entryId).success || !parsed.success) return INVALID;
  const entry = await updateEntry(userId, entryId, parsed.data);
  if (!entry) return { ok: false, error: "That entry no longer exists." };
  refresh();
  return { ok: true, data: entry };
}

export async function deleteEntryAction(entryId: string): Promise<CalendarActionResult> {
  const userId = await getSessionUserId();
  if (!userId) return SIGN_IN;
  if (!id.safeParse(entryId).success) return INVALID;
  const ok = await deleteEntry(userId, entryId);
  if (!ok) return { ok: false, error: "That entry no longer exists." };
  refresh();
  return { ok: true };
}
