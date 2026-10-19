import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { activateLocalSubscription } from "@/lib/db/queries/e2e";
import { isE2EAuthEnabled } from "@/lib/e2e";
import { isSameOrigin } from "@/lib/request";

/** Demo only: activate a fake subscription so subscriber screens can be tried without Stripe. */
export async function POST(request: Request) {
  if (!isE2EAuthEnabled()) return new NextResponse("Not found", { status: 404 });
  if (!isSameOrigin(request)) return new NextResponse("Forbidden", { status: 403 });
  const userId = await getSessionUserId();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });
  await activateLocalSubscription(userId);
  return NextResponse.redirect(new URL("/settings/billing?checkout=success", request.url), 303);
}
