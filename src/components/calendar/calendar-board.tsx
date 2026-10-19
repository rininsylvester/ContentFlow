"use client";

import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardCode,
  KeyboardSensor,
  pointerWithin,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
  type KeyboardCoordinateGetter,
} from "@dnd-kit/core";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Lightbulb,
  PenLine,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  createEntryAction,
  deleteEntryAction,
  scheduleSavedItemAction,
  updateEntryAction,
} from "@/lib/actions/calendar";
import {
  addDays,
  addMonths,
  formatDay,
  formatMonth,
  sameMonth,
  todayISO,
  WEEKDAY_LABELS,
} from "@/lib/calendar/dates";
import { calendarHref, type CalendarView } from "@/lib/calendar/params";
import type { CalendarEntryView } from "@/lib/db/queries/calendar";
import { CALENDAR_STATUSES } from "@/lib/db/schema/enums";
import { cn } from "@/lib/utils";
import { EntryDialog, type EntryPatch } from "./entry-dialog";
import { STATUS_META } from "./status";

/** Drop on the day under the pointer; keyboard drags (no pointer) use the closest day. */
const collisionDetection: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  return hits.length > 0 ? hits : closestCenter(args);
};

const DIRECTIONS: Record<string, [number, number]> = {
  ArrowRight: [1, 0],
  ArrowLeft: [-1, 0],
  ArrowDown: [0, 1],
  ArrowUp: [0, -1],
};

/** Arrow keys jump to the neighbouring day cell instead of moving a few pixels. */
const gridKeyboardCoordinates: KeyboardCoordinateGetter = (event, { context }) => {
  const dir = DIRECTIONS[event.code];
  const { collisionRect, droppableRects } = context;
  if (!dir || !collisionRect) return undefined;
  event.preventDefault();

  const cx = collisionRect.left + collisionRect.width / 2;
  const cy = collisionRect.top + collisionRect.height / 2;
  let best: { x: number; y: number } | null = null;
  let bestDistance = Infinity;
  for (const rect of droppableRects.values()) {
    const dx = rect.left + rect.width / 2 - cx;
    const dy = rect.top + rect.height / 2 - cy;
    const along = dir[0] !== 0 ? dx * dir[0] : dy * dir[1];
    const across = dir[0] !== 0 ? Math.abs(dy) : Math.abs(dx);
    // Must be ahead in the arrow's direction and roughly in the same row/column.
    if (along <= 1 || across > along) continue;
    const distance = along + across * 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
  }
  if (!best) return undefined;
  return { x: best.x - collisionRect.width / 2, y: best.y - collisionRect.height / 2 };
};

export type SchedulableItem = { id: string; tool: "ideas" | "script" | string; title: string };

type OptimisticAction =
  | { type: "add"; entry: CalendarEntryView }
  | { type: "update"; id: string; patch: Partial<CalendarEntryView> }
  | { type: "delete"; id: string };

function reducer(entries: CalendarEntryView[], action: OptimisticAction): CalendarEntryView[] {
  switch (action.type) {
    case "add":
      return [...entries, action.entry];
    case "update":
      return entries.map((e) => (e.id === action.id ? { ...e, ...action.patch } : e));
    case "delete":
      return entries.filter((e) => e.id !== action.id);
  }
}

const tempEntry = (
  title: string,
  scheduledDate: string,
  status: CalendarEntryView["status"],
): CalendarEntryView => ({
  id: `temp-${crypto.randomUUID()}`,
  savedItemId: null,
  title,
  scheduledDate,
  status,
  platform: null,
  notes: null,
  position: 9999,
});

export function CalendarBoard({
  view,
  anchor,
  days,
  entries,
  savedItems,
}: {
  view: CalendarView;
  anchor: string;
  days: string[];
  entries: CalendarEntryView[];
  savedItems: SchedulableItem[];
}) {
  const [optimistic, apply] = useOptimistic(entries, reducer);
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState<CalendarEntryView | null>(null);
  const [dragging, setDragging] = useState<{ title: string } | null>(null);
  const [today, setToday] = useState<string | null>(null);

  // "Today" depends on the viewer's time zone, so resolve it after hydration.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only value
    setToday(todayISO());
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    // Space picks up and drops; Enter is left free to open the entry.
    useSensor(KeyboardSensor, {
      keyboardCodes: {
        start: [KeyboardCode.Space],
        cancel: [KeyboardCode.Esc],
        end: [KeyboardCode.Space, KeyboardCode.Enter],
      },
      coordinateGetter: gridKeyboardCoordinates,
    }),
  );

  const mutate = (
    optimisticAction: OptimisticAction,
    run: () => Promise<{ ok: boolean; error?: string }>,
    success?: string,
  ) =>
    startTransition(async () => {
      apply(optimisticAction);
      const res = await run();
      if (!res.ok) toast.error(res.error ?? "Something went wrong.");
      else if (success) toast.success(success);
    });

  function onDragStart(event: DragStartEvent) {
    const data = event.active.data.current as { title: string } | undefined;
    setDragging(data ? { title: data.title } : null);
  }

  function onDragEnd(event: DragEndEvent) {
    setDragging(null);
    const overId = event.over?.id;
    if (typeof overId !== "string" || !overId.startsWith("day:")) return;
    const date = overId.slice(4);
    const data = event.active.data.current as
      | { kind: "entry"; entry: CalendarEntryView; title: string }
      | { kind: "saved"; item: SchedulableItem; title: string }
      | undefined;
    if (!data) return;

    if (data.kind === "entry") {
      if (data.entry.scheduledDate === date || data.entry.id.startsWith("temp-")) return;
      mutate({ type: "update", id: data.entry.id, patch: { scheduledDate: date } }, () =>
        updateEntryAction(data.entry.id, { scheduledDate: date }),
      );
    } else {
      const status = data.item.tool === "script" ? "scripted" : "idea";
      mutate(
        { type: "add", entry: tempEntry(data.item.title, date, status) },
        () => scheduleSavedItemAction(data.item.id, date),
        `Scheduled for ${formatDay(date, { month: "short", day: "numeric" })}`,
      );
    }
  }

  const prev = view === "month" ? addMonths(anchor, -1) : addDays(anchor, -7);
  const next = view === "month" ? addMonths(anchor, 1) : addDays(anchor, 7);
  const label =
    view === "month"
      ? formatMonth(anchor)
      : `${formatDay(days[0]!, { month: "short", day: "numeric" })} – ${formatDay(days[6]!, { month: "short", day: "numeric", year: "numeric" })}`;

  const byDay = new Map<string, CalendarEntryView[]>();
  for (const e of optimistic)
    byDay.set(e.scheduledDate, [...(byDay.get(e.scheduledDate) ?? []), e]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setDragging(null)}
      accessibility={{
        screenReaderInstructions: {
          draggable:
            "To pick up an item, press Space. Use the arrow keys to move it over a day, then press Space again to drop it. Press Escape to cancel. Press Enter to open an entry.",
        },
      }}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <Button
              asChild
              variant="outline"
              size="icon"
              aria-label={view === "month" ? "Previous month" : "Previous week"}
            >
              <Link href={calendarHref(view, prev)} scroll={false}>
                <ChevronLeft />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="icon"
              aria-label={view === "month" ? "Next month" : "Next week"}
            >
              <Link href={calendarHref(view, next)} scroll={false}>
                <ChevronRight />
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="h-9">
              <Link href={calendarHref(view, today ?? anchor)} scroll={false}>
                Today
              </Link>
            </Button>
          </div>
          <h2 className="text-lg font-semibold" aria-live="polite">
            {label}
          </h2>
          <div
            role="group"
            aria-label="Calendar view"
            className="ml-auto flex rounded-md border p-0.5"
          >
            {(["month", "week"] as const).map((v) => (
              <Button
                key={v}
                asChild
                size="sm"
                variant={view === v ? "secondary" : "ghost"}
                className="h-8 capitalize"
              >
                <Link
                  href={calendarHref(v, anchor)}
                  aria-current={view === v ? "page" : undefined}
                  scroll={false}
                >
                  {v}
                </Link>
              </Button>
            ))}
          </div>
        </div>

        <ul
          className="flex flex-wrap gap-3 text-xs text-muted-foreground"
          aria-label="Status legend"
        >
          {CALENDAR_STATUSES.map((s) => (
            <li key={s} className="flex items-center gap-1.5">
              <span className={cn("size-2 rounded-full", STATUS_META[s].dot)} aria-hidden />
              {STATUS_META[s].label}
            </li>
          ))}
        </ul>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_16rem]">
          <div className="overflow-x-auto">
            <div className="min-w-[640px]">
              <div
                className="grid grid-cols-7 border-b pb-2 text-xs font-medium text-muted-foreground"
                aria-hidden
              >
                {WEEKDAY_LABELS.map((d) => (
                  <div key={d} className="px-2">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 border-l">
                {days.map((day) => (
                  <DayCell
                    key={day}
                    day={day}
                    view={view}
                    outside={view === "month" && !sameMonth(day, anchor)}
                    isToday={day === today}
                    entries={byDay.get(day) ?? []}
                    onOpen={setEditing}
                    onCreate={(title) =>
                      mutate({ type: "add", entry: tempEntry(title, day, "idea") }, () =>
                        createEntryAction({ title, scheduledDate: day }),
                      )
                    }
                  />
                ))}
              </div>
            </div>
          </div>

          <aside
            className="flex flex-col gap-3 rounded-xl border bg-card p-4"
            aria-labelledby="saved-panel-title"
          >
            <div>
              <h3 id="saved-panel-title" className="text-sm font-medium">
                Saved ideas & scripts
              </h3>
              <p className="text-xs text-muted-foreground">Drag onto a day to schedule.</p>
            </div>
            {savedItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing saved yet.{" "}
                <Link href="/ideas" className="text-primary underline underline-offset-4">
                  Generate ideas
                </Link>{" "}
                and press Save.
              </p>
            ) : (
              <ul className="flex max-h-[28rem] flex-col gap-2 overflow-y-auto">
                {savedItems.map((item) => (
                  <li key={item.id}>
                    <SavedChip item={item} />
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {dragging && (
          <div className="max-w-56 truncate rounded-md border bg-popover px-2 py-1 text-xs font-medium shadow-lg">
            {dragging.title}
          </div>
        )}
      </DragOverlay>

      <EntryDialog
        entry={editing}
        onOpenChange={(open) => !open && setEditing(null)}
        onSave={(id, patch: EntryPatch) => {
          setEditing(null);
          mutate(
            { type: "update", id, patch },
            () => updateEntryAction(id, patch),
            "Entry updated",
          );
        }}
        onDelete={(id) => {
          setEditing(null);
          mutate({ type: "delete", id }, () => deleteEntryAction(id), "Entry deleted");
        }}
      />
    </DndContext>
  );
}

function DayCell({
  day,
  view,
  outside,
  isToday,
  entries,
  onOpen,
  onCreate,
}: {
  day: string;
  view: CalendarView;
  outside: boolean;
  isToday: boolean;
  entries: CalendarEntryView[];
  onOpen: (entry: CalendarEntryView) => void;
  onCreate: (title: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `day:${day}` });
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const dayLabel = formatDay(day, { weekday: "long", month: "long", day: "numeric" });

  return (
    <div
      ref={setNodeRef}
      role="group"
      aria-label={`${dayLabel}, ${entries.length} ${entries.length === 1 ? "entry" : "entries"}`}
      className={cn(
        "group/day flex flex-col gap-1 border-r border-b p-1.5 transition-colors",
        view === "month" ? "min-h-28" : "min-h-80",
        outside && "bg-muted/30 text-muted-foreground",
        isOver && "bg-primary/10 ring-2 ring-primary ring-inset",
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "flex size-6 items-center justify-center rounded-full text-xs tabular-nums",
            isToday && "bg-primary font-semibold text-primary-foreground",
          )}
        >
          {Number(day.slice(8))}
        </span>
        <Popover open={adding} onOpenChange={setAdding}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-6 opacity-0 group-hover/day:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
              aria-label={`Add entry on ${dayLabel}`}
            >
              <Plus className="size-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="end">
            <form
              className="grid gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!title.trim()) return;
                onCreate(title.trim());
                setTitle("");
                setAdding(false);
              }}
            >
              <label htmlFor={`new-${day}`} className="text-xs font-medium">
                New entry · {formatDay(day, { month: "short", day: "numeric" })}
              </label>
              <Input
                id={`new-${day}`}
                autoFocus
                maxLength={300}
                placeholder="What are you posting?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Button type="submit" size="sm">
                Add
              </Button>
            </form>
          </PopoverContent>
        </Popover>
      </div>
      <ul className="flex flex-col gap-1">
        {entries.map((e) => (
          <li key={e.id}>
            <EntryChip entry={e} onOpen={onOpen} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function EntryChip({
  entry,
  onOpen,
}: {
  entry: CalendarEntryView;
  onOpen: (entry: CalendarEntryView) => void;
}) {
  const pending = entry.id.startsWith("temp-");
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `entry:${entry.id}`,
    data: { kind: "entry", entry, title: entry.title },
    disabled: pending,
  });
  const meta = STATUS_META[entry.status];

  return (
    <button
      ref={setNodeRef}
      type="button"
      {...attributes}
      {...listeners}
      onClick={() => !pending && onOpen(entry)}
      aria-label={`${entry.title}, ${meta.label}${entry.platform ? `, ${entry.platform}` : ""}`}
      aria-roledescription="draggable entry"
      className={cn(
        "flex w-full touch-none items-center gap-1.5 rounded border px-1.5 py-1 text-left text-xs transition-opacity focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        meta.className,
        isDragging && "opacity-40",
        pending && "animate-pulse cursor-wait",
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", meta.dot)} aria-hidden />
      <span className="truncate">{entry.title}</span>
    </button>
  );
}

function SavedChip({ item }: { item: SchedulableItem }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `saved:${item.id}`,
    data: { kind: "saved", item, title: item.title },
  });
  const Icon = item.tool === "script" ? PenLine : item.tool === "ideas" ? Lightbulb : CalendarDays;
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      aria-roledescription="draggable saved item"
      className={cn(
        "flex cursor-grab touch-none items-center gap-2 rounded-md border bg-background px-2 py-1.5 text-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:cursor-grabbing",
        isDragging && "opacity-40",
      )}
    >
      <GripVertical className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
      <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
      <span className="truncate">{item.title}</span>
    </div>
  );
}
