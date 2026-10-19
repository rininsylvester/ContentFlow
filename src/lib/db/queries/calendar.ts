import "server-only";
import { and, asc, eq, gte, lte, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { calendarEntries, type CalendarEntry, type CalendarStatus } from "@/lib/db/schema";

export type CalendarEntryView = Pick<
  CalendarEntry,
  "id" | "savedItemId" | "title" | "scheduledDate" | "platform" | "status" | "position" | "notes"
>;

const columns = {
  id: calendarEntries.id,
  savedItemId: calendarEntries.savedItemId,
  title: calendarEntries.title,
  scheduledDate: calendarEntries.scheduledDate,
  platform: calendarEntries.platform,
  status: calendarEntries.status,
  position: calendarEntries.position,
  notes: calendarEntries.notes,
};

export async function listEntries(
  userId: string,
  from: string,
  to: string,
): Promise<CalendarEntryView[]> {
  return getDb()
    .select(columns)
    .from(calendarEntries)
    .where(
      and(
        eq(calendarEntries.userId, userId),
        gte(calendarEntries.scheduledDate, from),
        lte(calendarEntries.scheduledDate, to),
      ),
    )
    .orderBy(
      asc(calendarEntries.scheduledDate),
      asc(calendarEntries.position),
      asc(calendarEntries.createdAt),
    );
}

export async function createEntry(values: {
  userId: string;
  title: string;
  scheduledDate: string;
  savedItemId?: string;
  platform?: string;
  status?: CalendarStatus;
}): Promise<CalendarEntryView> {
  const db = getDb();
  const [{ next } = { next: 0 }] = await db
    .select({ next: sql<number>`coalesce(max(${calendarEntries.position}) + 1, 0)::int` })
    .from(calendarEntries)
    .where(
      and(
        eq(calendarEntries.userId, values.userId),
        eq(calendarEntries.scheduledDate, values.scheduledDate),
      ),
    );
  const [row] = await db
    .insert(calendarEntries)
    .values({ ...values, position: next })
    .returning(columns);
  if (!row) throw new Error("Failed to create calendar entry");
  return row;
}

export async function updateEntry(
  userId: string,
  id: string,
  patch: Partial<
    Pick<CalendarEntry, "title" | "scheduledDate" | "status" | "platform" | "notes" | "position">
  >,
): Promise<CalendarEntryView | null> {
  const [row] = await getDb()
    .update(calendarEntries)
    .set(patch)
    .where(and(eq(calendarEntries.id, id), eq(calendarEntries.userId, userId)))
    .returning(columns);
  return row ?? null;
}

export async function deleteEntry(userId: string, id: string): Promise<boolean> {
  const rows = await getDb()
    .delete(calendarEntries)
    .where(and(eq(calendarEntries.id, id), eq(calendarEntries.userId, userId)))
    .returning({ id: calendarEntries.id });
  return rows.length > 0;
}
