import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { billedAsEnum, calendarStatusEnum, generationStatusEnum, toolEnum } from "./enums";
import { createdAt, ownerAllPolicy, ownerSelectPolicy, tsvector, updatedAt } from "./helpers";
import { users } from "./users";

/**
 * Every AI call. The row is inserted as `pending` with the input *before* the
 * model is called, so user input survives provider errors and timeouts.
 */
export const generations = pgTable(
  "generations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tool: toolEnum("tool").notNull(),
    input: jsonb("input").$type<unknown>().notNull(),
    output: jsonb("output").$type<unknown>(),
    status: generationStatusEnum("status").notNull().default("pending"),
    errorCode: text("error_code"),
    parentId: uuid("parent_id").references((): AnyPgColumn => generations.id, {
      onDelete: "set null",
    }),
    model: text("model").notNull(),
    promptVersion: text("prompt_version").notNull(),
    brandVoiceApplied: boolean("brand_voice_applied").notNull().default(false),
    inputTokens: integer("input_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull().default(0),
    costUsdMicros: integer("cost_usd_micros").notNull().default(0),
    latencyMs: integer("latency_ms"),
    billedAs: billedAsEnum("billed_as").notNull().default("none"),
    createdAt: createdAt(),
  },
  (t) => [
    index("generations_user_created_idx").on(t.userId, t.createdAt.desc()),
    ownerSelectPolicy("generations", t.userId),
  ],
).enableRLS();

export const savedItems = pgTable(
  "saved_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    generationId: uuid("generation_id").references(() => generations.id, {
      onDelete: "set null",
    }),
    tool: toolEnum("tool").notNull(),
    title: text("title").notNull(),
    content: jsonb("content").$type<unknown>().notNull(),
    tags: text("tags").array().notNull().default([]),
    isFavorite: boolean("is_favorite").notNull().default(false),
    search: tsvector("search").generatedAlwaysAs(
      sql`setweight(to_tsvector('english'::regconfig, coalesce(title, '')), 'A') || setweight(jsonb_to_tsvector('english'::regconfig, content, '["string"]'::jsonb), 'B')`,
    ),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("saved_items_user_created_idx").on(t.userId, t.createdAt.desc()),
    index("saved_items_search_idx").using("gin", t.search),
    index("saved_items_tags_idx").using("gin", t.tags),
    ownerAllPolicy("saved_items", t.userId),
  ],
).enableRLS();

export const calendarEntries = pgTable(
  "calendar_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    savedItemId: uuid("saved_item_id").references(() => savedItems.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    scheduledDate: date("scheduled_date", { mode: "string" }).notNull(),
    platform: text("platform"),
    status: calendarStatusEnum("status").notNull().default("idea"),
    position: integer("position").notNull().default(0),
    notes: text("notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("calendar_entries_user_date_idx").on(t.userId, t.scheduledDate),
    ownerAllPolicy("calendar_entries", t.userId),
  ],
).enableRLS();

export type Generation = typeof generations.$inferSelect;
export type SavedItem = typeof savedItems.$inferSelect;
export type CalendarEntry = typeof calendarEntries.$inferSelect;
