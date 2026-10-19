/**
 * Calendar dates are plain "YYYY-MM-DD" strings (no time zone), matching the
 * `date` column. All arithmetic is done in UTC so it never shifts a day.
 * Weeks start on Monday.
 */
const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isISODate(value: string): boolean {
  const m = ISO.exec(value);
  if (!m) return false;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return (
    d.getUTCFullYear() === Number(m[1]) &&
    d.getUTCMonth() === Number(m[2]) - 1 &&
    d.getUTCDate() === Number(m[3])
  );
}

function toDate(iso: string): Date {
  const m = ISO.exec(iso);
  if (!m) throw new Error(`Invalid ISO date: ${iso}`);
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

function fromDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Today in the viewer's local time zone. */
export function todayISO(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function addDays(iso: string, days: number): string {
  const d = toDate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return fromDate(d);
}

export function startOfWeek(iso: string): string {
  const d = toDate(iso);
  const offset = (d.getUTCDay() + 6) % 7; // Monday = 0
  return addDays(iso, -offset);
}

export function startOfMonth(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

export function addMonths(iso: string, months: number): string {
  const d = toDate(startOfMonth(iso));
  d.setUTCMonth(d.getUTCMonth() + months);
  return fromDate(d);
}

/** 6 full weeks (42 days) covering the month, starting on a Monday. */
export function monthGrid(iso: string): string[] {
  const start = startOfWeek(startOfMonth(iso));
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

export function weekDays(iso: string): string[] {
  const start = startOfWeek(iso);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function sameMonth(a: string, b: string): boolean {
  return a.slice(0, 7) === b.slice(0, 7);
}

export function formatMonth(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(toDate(iso));
}

export function formatDay(iso: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(toDate(iso));
}

export const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
