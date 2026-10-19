import { publicEnv } from "@/lib/env";

/**
 * CSRF guard for state-changing form POSTs: the request must come from our own
 * origin. (Supabase cookies are SameSite=Lax too, so this is defense in depth.)
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const allowed = new Set([
    new URL(publicEnv.NEXT_PUBLIC_SITE_URL).origin,
    new URL(request.url).origin,
  ]);
  return allowed.has(origin);
}
