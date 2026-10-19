import "server-only";
import { and, arrayContains, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { savedItems, type SavedItem, type Tool } from "@/lib/db/schema";

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

export type LibraryFilters = {
  q?: string;
  tool?: Tool;
  tag?: string;
  favorites?: boolean;
  limit: number;
};

export type LibraryItem = Omit<SavedItem, "search" | "userId">;

/** Escape LIKE wildcards in user input. */
function likePattern(q: string): string {
  return `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

export async function listSavedItems(
  userId: string,
  filters: LibraryFilters,
): Promise<{ items: LibraryItem[]; hasMore: boolean }> {
  const conditions = [eq(savedItems.userId, userId)];
  const q = filters.q?.trim();
  if (q) {
    const match = or(
      sql`${savedItems.search} @@ websearch_to_tsquery('english', ${q})`,
      ilike(savedItems.title, likePattern(q)),
    );
    if (match) conditions.push(match);
  }
  if (filters.tool) conditions.push(eq(savedItems.tool, filters.tool));
  if (filters.tag) conditions.push(arrayContains(savedItems.tags, [filters.tag]));
  if (filters.favorites) conditions.push(eq(savedItems.isFavorite, true));

  const rows = await getDb()
    .select({
      id: savedItems.id,
      generationId: savedItems.generationId,
      tool: savedItems.tool,
      title: savedItems.title,
      content: savedItems.content,
      tags: savedItems.tags,
      isFavorite: savedItems.isFavorite,
      createdAt: savedItems.createdAt,
      updatedAt: savedItems.updatedAt,
    })
    .from(savedItems)
    .where(and(...conditions))
    .orderBy(desc(savedItems.createdAt), desc(savedItems.id))
    .limit(filters.limit + 1);

  return { items: rows.slice(0, filters.limit), hasMore: rows.length > filters.limit };
}

export async function listTags(userId: string): Promise<string[]> {
  const rows = await getDb().execute<{ tag: string }>(
    sql`select distinct unnest(${savedItems.tags}) as tag from ${savedItems} where ${savedItems.userId} = ${userId} order by tag`,
  );
  return rows.map((r) => r.tag);
}

export async function setFavorite(
  userId: string,
  id: string,
  isFavorite: boolean,
): Promise<boolean> {
  const rows = await getDb()
    .update(savedItems)
    .set({ isFavorite })
    .where(and(eq(savedItems.id, id), eq(savedItems.userId, userId)))
    .returning({ id: savedItems.id });
  return rows.length > 0;
}

export async function setTags(userId: string, id: string, tags: string[]): Promise<boolean> {
  const rows = await getDb()
    .update(savedItems)
    .set({ tags })
    .where(and(eq(savedItems.id, id), eq(savedItems.userId, userId)))
    .returning({ id: savedItems.id });
  return rows.length > 0;
}

export async function duplicateSavedItem(userId: string, id: string): Promise<string | null> {
  const [source] = await getDb()
    .select()
    .from(savedItems)
    .where(and(eq(savedItems.id, id), eq(savedItems.userId, userId)))
    .limit(1);
  if (!source) return null;
  return createSavedItem({
    userId,
    tool: source.tool,
    title: `${source.title} (copy)`.slice(0, 300),
    content: source.content,
    tags: source.tags,
    generationId: source.generationId ?? undefined,
  });
}

export async function deleteSavedItem(userId: string, id: string): Promise<boolean> {
  const rows = await getDb()
    .delete(savedItems)
    .where(and(eq(savedItems.id, id), eq(savedItems.userId, userId)))
    .returning({ id: savedItems.id });
  return rows.length > 0;
}

/** Saved ideas and scripts, for dragging onto the content calendar. */
export async function listSchedulableItems(userId: string, limit = 50) {
  return getDb()
    .select({ id: savedItems.id, tool: savedItems.tool, title: savedItems.title })
    .from(savedItems)
    .where(and(eq(savedItems.userId, userId), inArray(savedItems.tool, ["ideas", "script"])))
    .orderBy(desc(savedItems.createdAt))
    .limit(limit);
}

export async function isOwnSavedItem(userId: string, id: string): Promise<boolean> {
  const [row] = await getDb()
    .select({ id: savedItems.id })
    .from(savedItems)
    .where(and(eq(savedItems.id, id), eq(savedItems.userId, userId)))
    .limit(1);
  return Boolean(row);
}

export async function getSavedItemSummary(userId: string, id: string) {
  const [row] = await getDb()
    .select({ title: savedItems.title, tool: savedItems.tool })
    .from(savedItems)
    .where(and(eq(savedItems.id, id), eq(savedItems.userId, userId)))
    .limit(1);
  return row ?? null;
}
