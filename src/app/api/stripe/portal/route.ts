import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { getStripe } from "@/lib/billing/stripe";
import { findUserById } from "@/lib/db/queries/users";
import { publicEnv } from "@/lib/env";
import { isSameOrigin } from "@/lib/request";

/** Opens the Stripe Customer Portal ("Manage billing"). */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return new NextResponse("Forbidden", { status: 403 });
  const billing = `${publicEnv.NEXT_PUBLIC_SITE_URL}/settings/billing`;

  const userId = await getSessionUserId();
  if (!userId)
    return NextResponse.redirect(
      `${publicEnv.NEXT_PUBLIC_SITE_URL}/login?next=/settings/billing`,
      303,
    );
  const user = await findUserById(userId);
  if (!user?.stripeCustomerId) return NextResponse.redirect(billing, 303);

  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: billing,
    });
    return NextResponse.redirect(session.url, 303);
  } catch (error) {
    console.error("[billing] portal failed", error);
    return NextResponse.redirect(`${billing}?error=portal`, 303);
  }
}
