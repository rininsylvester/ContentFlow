import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { findUserById } from "@/lib/db/queries/users";
import type { User } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";

/** Verified id of the signed-in user, or null. Validates the JWT signature. */
export const getSessionUserId = cache(async (): Promise<string | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  return data.claims.sub;
});

/**
 * Data Access Layer entry point: the signed-in user's profile row.
 * Redirects to /login when there is no valid session. Deduplicated per request.
 */
export const getCurrentUser = cache(async (): Promise<User> => {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const user = await findUserById(userId);
  if (!user) redirect("/login");

  return user;
});
