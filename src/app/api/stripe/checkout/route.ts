import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { getPriceId, getStripe } from "@/lib/billing/stripe";
import { hasActiveSubscription } from "@/lib/billing/usage-summary";
import { setStripeCustomerId } from "@/lib/db/queries/billing-users";
import { findUserById } from "@/lib/db/queries/users";
import { publicEnv } from "@/lib/env";
import { isSameOrigin } from "@/lib/request";

const billingUrl = (query = "") => `${publicEnv.NEXT_PUBLIC_SITE_URL}/settings/billing${query}`;

/** Starts a Stripe Checkout session for the $5/month plan (form POST → 303 redirect). */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return new NextResponse("Forbidden", { status: 403 });

  const userId = await getSessionUserId();
  if (!userId)
    return NextResponse.redirect(
      `${publicEnv.NEXT_PUBLIC_SITE_URL}/login?next=/settings/billing`,
      303,
    );
  const user = await findUserById(userId);
  if (!user) return NextResponse.redirect(`${publicEnv.NEXT_PUBLIC_SITE_URL}/login`, 303);

  if (hasActiveSubscription(user.subscriptionStatus, user.currentPeriodEnd)) {
    return NextResponse.redirect(billingUrl(), 303);
  }

  try {
    const stripe = getStripe();
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await setStripeCustomerId(user.id, customerId);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: getPriceId(), quantity: 1 }],
      client_reference_id: user.id,
      metadata: { userId: user.id },
      subscription_data: { metadata: { userId: user.id } },
      allow_promotion_codes: true,
      success_url: billingUrl("?checkout=success"),
      cancel_url: billingUrl("?checkout=canceled"),
    });
    if (!session.url) throw new Error("Checkout session has no URL");
    return NextResponse.redirect(session.url, 303);
  } catch (error) {
    console.error("[billing] checkout failed", error);
    return NextResponse.redirect(billingUrl("?error=checkout"), 303);
  }
}
