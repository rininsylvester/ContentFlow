import { NextResponse } from "next/server";
import { z } from "zod";
import { findOrCreateLocalUser } from "@/lib/db/queries/e2e";
import { E2E_COOKIE, isE2EAuthEnabled } from "@/lib/e2e";

const bodySchema = z.object({ email: z.email(), name: z.string().trim().max(80).optional() });

/**
 * Local dev sign-in (Playwright tests and `pnpm demo`). 404 unless enabled,
 * which is only possible on a development server.
 */
export async function POST(request: Request) {
  if (!isE2EAuthEnabled()) return new NextResponse("Not found", { status: 404 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "email required" }, { status: 400 });

  const user = await findOrCreateLocalUser(parsed.data.email, parsed.data.name);
  const res = NextResponse.json({ userId: user.id, onboarded: user.onboarded });
  res.cookies.set(E2E_COOKIE, user.id, { httpOnly: true, sameSite: "lax", path: "/" });
  return res;
}
