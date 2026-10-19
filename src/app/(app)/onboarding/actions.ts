"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { markOnboarded } from "@/lib/db/queries/users";

export async function skipOnboarding(): Promise<void> {
  const user = await getCurrentUser();
  await markOnboarded(user.id);
  redirect("/ideas");
}
