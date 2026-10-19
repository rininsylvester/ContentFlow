import "server-only";
import { getDb } from "@/lib/db/client";
import { savedItems, type Tool } from "@/lib/db/schema";

export async function createSavedItem(values: {
  userId: string;
  tool: Tool;
  title: string;
  content: unknown;
  generationId?: string;
  tags?: string[];
}): Promise<string> {
  const [row] = await getDb().insert(savedItems).values(values).returning({ id: savedItems.id });
  if (!row) throw new Error("Failed to save item");
  return row.id;
}
