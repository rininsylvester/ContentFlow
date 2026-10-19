import { NextResponse } from "next/server";
import { z } from "zod";
import { createE2EUser } from "@/lib/db/queries/e2e";
import { E2E_COOKIE, isE2EAuthEnabled } from "@/lib/e2e";

/** Test-only signup used by the Playwright smoke test. 404 unless E2E auth is enabled (dev only). */
export async function POST(request: Request) {
  if (!isE2EAuthEnabled()) return new NextResponse("Not found", { status: 404 });

  const parsed = z.object({ email: z.email() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "email required" }, { status: 400 });

  const userId = await createE2EUser(parsed.data.email);
  const res = NextResponse.json({ userId });
  res.cookies.set(E2E_COOKIE, userId, { httpOnly: true, sameSite: "lax", path: "/" });
  return res;
}
