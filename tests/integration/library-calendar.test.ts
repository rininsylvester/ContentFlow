import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getDb } from "@/lib/db/client";
import { createEntry, deleteEntry, listEntries, updateEntry } from "@/lib/db/queries/calendar";
import {
  createSavedItem,
  deleteSavedItem,
  duplicateSavedItem,
  listSavedItems,
  listTags,
  setFavorite,
  setTags,
} from "@/lib/db/queries/saved-items";

const enabled = Boolean(process.env.DATABASE_URL);

async function createUser(): Promise<string> {
  const id = randomUUID();
  await getDb().execute(
    sql`insert into auth.users (id, email) values (${id}, ${`${id}@test.dev`})`,
  );
  return id;
}

describe.skipIf(!enabled)("library and calendar queries (integration)", () => {
  let alice: string;
  let bob: string;

  beforeEach(async () => {
    alice = await createUser();
    bob = await createUser();
  });

  afterAll(async () => {
    await getDb().execute(sql`delete from auth.users where email like '%@test.dev'`);
  });

  it("searches titles and content, filters by tool, tag and favorite", async () => {
    const espresso = await createSavedItem({
      userId: alice,
      tool: "seo",
      title: "Home espresso pack",
      content: { description: "Pull your first shot" },
      tags: ["coffee"],
    });
    await createSavedItem({
      userId: alice,
      tool: "ideas",
      title: "Morning workouts",
      content: { idea: { hook: "Five minute routine" } },
    });
    await createSavedItem({ userId: bob, tool: "seo", title: "Bob espresso", content: {} });

    const byContent = await listSavedItems(alice, { q: "shot", limit: 24 });
    expect(byContent.items.map((i) => i.id)).toEqual([espresso]);
    const byPartialTitle = await listSavedItems(alice, { q: "espres", limit: 24 });
    expect(byPartialTitle.items.map((i) => i.id)).toEqual([espresso]);
    expect((await listSavedItems(alice, { q: "100%_", limit: 24 })).items).toHaveLength(0);

    expect((await listSavedItems(alice, { tool: "ideas", limit: 24 })).items).toHaveLength(1);
    expect((await listSavedItems(alice, { tag: "coffee", limit: 24 })).items).toHaveLength(1);
    expect(await listTags(alice)).toEqual(["coffee"]);

    expect(await setFavorite(alice, espresso, true)).toBe(true);
    expect(
      (await listSavedItems(alice, { favorites: true, limit: 24 })).items.map((i) => i.id),
    ).toEqual([espresso]);
  });

  it("paginates with hasMore", async () => {
    for (let i = 0; i < 3; i++)
      await createSavedItem({ userId: alice, tool: "hooks", title: `H${i}`, content: {} });
    const page = await listSavedItems(alice, { limit: 2 });
    expect(page.items).toHaveLength(2);
    expect(page.hasMore).toBe(true);
  });

  it("never lets one user touch another user's items", async () => {
    const item = await createSavedItem({
      userId: alice,
      tool: "ideas",
      title: "Mine",
      content: {},
    });
    expect(await setFavorite(bob, item, true)).toBe(false);
    expect(await setTags(bob, item, ["x"])).toBe(false);
    expect(await duplicateSavedItem(bob, item)).toBeNull();
    expect(await deleteSavedItem(bob, item)).toBe(false);
    expect((await listSavedItems(bob, { limit: 24 })).items).toHaveLength(0);

    const copy = await duplicateSavedItem(alice, item);
    expect(copy).not.toBeNull();
    expect(await deleteSavedItem(alice, item)).toBe(true);
  });

  it("creates, orders, moves and scopes calendar entries", async () => {
    const a = await createEntry({ userId: alice, title: "A", scheduledDate: "2026-10-20" });
    const b = await createEntry({ userId: alice, title: "B", scheduledDate: "2026-10-20" });
    expect([a.position, b.position]).toEqual([0, 1]);
    await createEntry({ userId: bob, title: "Bob", scheduledDate: "2026-10-20" });

    expect((await listEntries(alice, "2026-10-01", "2026-10-31")).map((e) => e.title)).toEqual([
      "A",
      "B",
    ]);
    expect(await listEntries(alice, "2026-11-01", "2026-11-30")).toHaveLength(0);

    const moved = await updateEntry(alice, a.id, { scheduledDate: "2026-10-22", status: "filmed" });
    expect(moved).toMatchObject({ scheduledDate: "2026-10-22", status: "filmed" });

    expect(await updateEntry(bob, a.id, { title: "hijack" })).toBeNull();
    expect(await deleteEntry(bob, a.id)).toBe(false);
    expect(await deleteEntry(alice, a.id)).toBe(true);
  });
});
