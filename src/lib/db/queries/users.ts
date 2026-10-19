import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { users, type User } from "@/lib/db/schema";

export async function findUserById(userId: string): Promise<User | undefined> {
  const [row] = await getDb().select().from(users).where(eq(users.id, userId)).limit(1);
  return row;
}

export async function markOnboarded(userId: string): Promise<void> {
  await getDb().update(users).set({ onboardedAt: new Date() }).where(eq(users.id, userId));
}
