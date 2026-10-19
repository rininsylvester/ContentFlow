import "server-only";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";

/** Creates an auth user directly in the local test database (the signup trigger makes the profile). */
export async function createE2EUser(email: string): Promise<string> {
  const id = randomUUID();
  await getDb().execute(sql`insert into auth.users (id, email) values (${id}, ${email})`);
  return id;
}
