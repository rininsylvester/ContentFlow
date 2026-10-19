import { connection } from "next/server";
import { Suspense } from "react";
import { CalendarBoard } from "@/components/calendar/calendar-board";
import { ToolHeader } from "@/components/tools/tool-header";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/lib/auth";
import { parseCalendarParams } from "@/lib/calendar/params";
import { listEntries } from "@/lib/db/queries/calendar";
import { listSchedulableItems } from "@/lib/db/queries/saved-items";
import { findNavItem } from "@/lib/tools";

const item = findNavItem("calendar");
export const metadata = { title: item.label };

async function CalendarLoader({
  searchParams,
}: {
  searchParams: PageProps<"/calendar">["searchParams"];
}) {
  const raw = await searchParams;
  // "Today" (the default anchor) is per-request, so opt out of prerendering before reading the clock.
  await connection();
  const { view, anchor, days, from, to } = parseCalendarParams(raw);
  const user = await getCurrentUser();
  const [entries, savedItems] = await Promise.all([
    listEntries(user.id, from, to),
    listSchedulableItems(user.id),
  ]);
  return (
    <CalendarBoard
      key={`${view}-${from}`}
      view={view}
      anchor={anchor}
      days={days}
      entries={entries}
      savedItems={savedItems}
    />
  );
}

export default function CalendarPage({ searchParams }: PageProps<"/calendar">) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8">
      <ToolHeader item={item} />
      <Suspense fallback={<Skeleton className="h-[640px] w-full rounded-xl" />}>
        <CalendarLoader searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
