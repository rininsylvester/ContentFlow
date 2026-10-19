import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Only allow same-origin relative paths as post-auth redirect targets,
 * preventing open redirects like `?next=//evil.com`.
 */
export function safeNextPath(next: string | null | undefined, fallback = "/ideas"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}
