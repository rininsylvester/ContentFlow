import "server-only";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { generations, type Tool } from "@/lib/db/schema";

export async function createPendingGeneration(values: {
  userId: string;
  tool: Tool;
  input: unknown;
  model: string;
  promptVersion: string;
  brandVoiceApplied: boolean;
  billedAs: "trial" | "subscription";
  parentId?: string;
}): Promise<string> {
  const [row] = await getDb()
    .insert(generations)
    .values({ ...values, status: "pending" })
    .returning({ id: generations.id });
  if (!row) throw new Error("Failed to create generation");
  return row.id;
}

export async function completeGeneration(
  id: string,
  values: {
    output: unknown;
    inputTokens: number;
    outputTokens: number;
    costUsdMicros: number;
    latencyMs: number;
  },
): Promise<void> {
  await getDb()
    .update(generations)
    .set({ ...values, status: "succeeded" })
    .where(eq(generations.id, id));
}

export async function failGeneration(
  id: string,
  values: {
    errorCode: string;
    inputTokens: number;
    outputTokens: number;
    costUsdMicros: number;
    latencyMs: number;
    refunded: boolean;
  },
): Promise<void> {
  const { refunded, ...rest } = values;
  await getDb()
    .update(generations)
    .set({ ...rest, status: "failed", ...(refunded ? { billedAs: "none" as const } : {}) })
    .where(eq(generations.id, id));
}

export async function isOwnGeneration(userId: string, id: string): Promise<boolean> {
  const [row] = await getDb()
    .select({ id: generations.id })
    .from(generations)
    .where(and(eq(generations.id, id), eq(generations.userId, userId)))
    .limit(1);
  return Boolean(row);
}
