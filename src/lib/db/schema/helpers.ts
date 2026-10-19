import { sql, type SQL } from "drizzle-orm";
import { customType, pgPolicy, timestamp, type AnyPgColumn } from "drizzle-orm/pg-core";
import { authenticatedRole, authUid } from "drizzle-orm/supabase";

export const tsvector = customType<{ data: string }>({
  dataType: () => "tsvector",
});

export const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

const isOwner = (userId: AnyPgColumn): SQL => sql`${userId} = ${authUid}`;

/** RLS: the signed-in user may read and write only their own rows. */
export const ownerAllPolicy = (table: string, userId: AnyPgColumn) =>
  pgPolicy(`${table}_owner_all`, {
    for: "all",
    to: authenticatedRole,
    using: isOwner(userId),
    withCheck: isOwner(userId),
  });

/** RLS: the signed-in user may read only their own rows (writes are server-only). */
export const ownerSelectPolicy = (table: string, userId: AnyPgColumn) =>
  pgPolicy(`${table}_owner_select`, {
    for: "select",
    to: authenticatedRole,
    using: isOwner(userId),
  });
