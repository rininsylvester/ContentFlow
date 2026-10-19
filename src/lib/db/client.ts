import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { serverEnv } from "@/lib/env.server";
import * as schema from "./schema";

/**
 * Drizzle connects as a privileged role and BYPASSES RLS. Every query must be
 * scoped by user id — go through `lib/db/queries/*`, never import `db` from UI code.
 */
function createDb() {
  // `prepare: false` is required by Supabase's transaction pooler (pgBouncer).
  const client = postgres(serverEnv().DATABASE_URL, { prepare: false, max: 5 });
  return drizzle(client, { schema });
}

type Db = ReturnType<typeof createDb>;

const globalForDb = globalThis as unknown as { __db?: Db };

export function getDb(): Db {
  globalForDb.__db ??= createDb();
  return globalForDb.__db;
}
