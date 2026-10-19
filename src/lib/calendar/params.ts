import { isISODate, monthGrid, todayISO, weekDays } from "./dates";

export type CalendarView = "month" | "week";

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export function parseCalendarParams(
  raw: Record<string, string | string[] | undefined>,
  now = new Date(),
) {
  const view: CalendarView = first(raw.view) === "week" ? "week" : "month";
  const date = first(raw.date);
  const anchor = date && isISODate(date) ? date : todayISO(now);
  const days = view === "month" ? monthGrid(anchor) : weekDays(anchor);
  return { view, anchor, days, from: days[0]!, to: days[days.length - 1]! };
}

export function calendarHref(view: CalendarView, date: string): string {
  return `/calendar?view=${view}&date=${date}`;
}
