#!/usr/bin/env node
/**
 * `pnpm demo` — run CreatorHub locally with no accounts, keys or Docker.
 *
 *   - Embedded Postgres (PGlite) in ./.demo, with the real migrations applied
 *   - "Continue with demo account" sign-in (dev server only)
 *   - Sample AI output (AI_MOCK=1); Stripe disabled, with a demo subscribe button
 *
 * Usage: pnpm demo            start (data is kept between runs)
 *        pnpm demo --reset    wipe the demo database first
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

const DATA_DIR = ".demo/db";
const DB_PORT = Number(process.env.DEMO_DB_PORT ?? 54329);
const APP_PORT = Number(process.env.PORT ?? 3000);

if (process.argv.includes("--reset") && existsSync(DATA_DIR)) {
  rmSync(DATA_DIR, { recursive: true, force: true });
  console.log("✓ Demo database reset");
}

mkdirSync(".demo", { recursive: true });
console.log("Starting embedded Postgres (PGlite)…");
const db = await PGlite.create(DATA_DIR);
const [{ exists }] = (await db.query("select to_regclass('auth.users') is not null as exists"))
  .rows;
if (!exists) await db.exec(readFileSync("tests/integration/supabase-stub.sql", "utf8"));
await migrate(drizzle(db), { migrationsFolder: "drizzle" });
console.log("✓ Database ready (migrations applied)");

const server = new PGLiteSocketServer({ db, host: "127.0.0.1", port: DB_PORT, maxConnections: 20 });
await server.start();

const siteUrl = `http://localhost:${APP_PORT}`;
const next = spawn("pnpm", ["exec", "next", "dev", "-p", String(APP_PORT)], {
  stdio: "inherit",
  env: {
    ...process.env,
    NODE_ENV: "development",
    E2E_AUTH: "1",
    AI_MOCK: "1",
    DATABASE_URL: `postgresql://postgres@127.0.0.1:${DB_PORT}/postgres`,
    NEXT_PUBLIC_SITE_URL: siteUrl,
    NEXT_PUBLIC_SUPABASE_URL: "https://demo.supabase.invalid",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_demo",
    // Blank values override anything in .env.local, so the demo never calls real services.
    ANTHROPIC_API_KEY: "",
    STRIPE_SECRET_KEY: "",
    STRIPE_WEBHOOK_SECRET: "",
    STRIPE_PRICE_ID: "",
  },
});

const lines = [
  `CreatorHub demo → ${siteUrl}`,
  "Open /login and click “Continue with demo account”.",
  "AI output is sample data. Payments are simulated.",
  "Press Ctrl+C to stop. `pnpm demo --reset` starts fresh.",
];
const width = Math.max(...lines.map((l) => l.length)) + 2;
console.log(
  [
    "",
    `  ┌${"─".repeat(width + 2)}┐`,
    ...lines.map((l) => `  │ ${l.padEnd(width)} │`),
    `  └${"─".repeat(width + 2)}┘`,
    "",
  ].join("\n"),
);

const shutdown = async () => {
  next.kill("SIGINT");
  await server.stop().catch(() => {});
  await db.close().catch(() => {});
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
next.on("exit", (code) => {
  void server.stop().finally(() => process.exit(code ?? 0));
});
