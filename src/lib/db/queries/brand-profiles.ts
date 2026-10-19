import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { brandProfiles, type BrandProfile } from "@/lib/db/schema";

export async function getBrandProfile(userId: string): Promise<BrandProfile | undefined> {
  const [row] = await getDb()
    .select()
    .from(brandProfiles)
    .where(eq(brandProfiles.userId, userId))
    .limit(1);
  return row;
}

export async function upsertBrandProfile(
  userId: string,
  values: Omit<typeof brandProfiles.$inferInsert, "userId" | "createdAt" | "updatedAt">,
): Promise<void> {
  await getDb()
    .insert(brandProfiles)
    .values({ userId, ...values })
    .onConflictDoUpdate({
      target: brandProfiles.userId,
      set: { ...values, updatedAt: new Date() },
    });
}
