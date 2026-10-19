import { NextResponse, type NextRequest } from "next/server";
import { findUserById } from "@/lib/db/queries/users";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/utils";

/** OAuth + magic-link (PKCE) landing: exchange the code for a session. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (!code) return NextResponse.redirect(`${origin}/auth/error`);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return NextResponse.redirect(`${origin}/auth/error`);

  const profile = await findUserById(data.user.id);
  const destination = profile?.onboardedAt ? next : "/onboarding";
  return NextResponse.redirect(`${origin}${destination}`);
}
