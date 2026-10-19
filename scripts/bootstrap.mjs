#!/usr/bin/env node
/**
 * One-command project setup: `pnpm bootstrap`.
 *
 * 1. Creates .env.local from .env.example if it's missing.
 * 2. Validates every env var and says where to find missing ones.
 * 3. Checks the database connection and applies migrations.
 * 4. Verifies the Anthropic API key against the configured model.
 * 5. Checks Supabase Auth (email + Google enabled) via the public settings endpoint.
 * 6. If SUPABASE_ACCESS_TOKEN is set, configures Supabase Auth automatically
 *    (site URL, redirect URLs, Google provider) through the Management API.
 *
 * Safe to re-run; every step is idempotent.
 */
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";

const ENV_FILE = ".env.local";
const MODEL = "claude-haiku-5-5";

const ok = (msg) => console.log(`  ✓ ${msg}`);
const warn = (msg) => console.log(`  ! ${msg}`);
const fail = (msg) => console.log(`  ✗ ${msg}`);
const step = (msg) => console.log(`\n${msg}`);
const todo = [];

step("1. Environment file");
if (!existsSync(ENV_FILE)) {
  copyFileSync(".env.example", ENV_FILE);
  ok(`Created ${ENV_FILE} from .env.example — fill in the values and re-run.`);
} else {
  ok(`${ENV_FILE} found`);
}
try {
  process.loadEnvFile(ENV_FILE);
} catch {
  // Variables may come from the shell instead.
}
const env = process.env;

step("2. Environment variables");
const REQUIRED = {
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000 locally, your domain in production",
  NEXT_PUBLIC_SUPABASE_URL: "Supabase → Project Settings → API → Project URL",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "Supabase → Project Settings → API Keys → publishable key",
  DATABASE_URL: "Supabase → Connect → Transaction pooler connection string",
  ANTHROPIC_API_KEY: "console.anthropic.com → API Keys (not needed if AI_MOCK=1)",
};
const missing = Object.entries(REQUIRED).filter(
  ([key]) => !env[key] || env[key].includes("YOUR-") || env[key].endsWith("_xxx"),
);
for (const [key, where] of Object.entries(REQUIRED)) {
  if (missing.some(([k]) => k === key)) {
    if (key === "ANTHROPIC_API_KEY" && env.AI_MOCK === "1")
      warn(`${key} not set (AI_MOCK=1, using mock AI)`);
    else {
      fail(`${key} is missing — ${where}`);
      todo.push(`Set ${key} in ${ENV_FILE}`);
    }
  } else ok(key);
}
if (env.AI_MOCK === "1")
  warn("AI_MOCK=1 — generations return sample data. Never set this in production.");

step("3. Database");
if (env.DATABASE_URL && !env.DATABASE_URL.includes("YOUR-")) {
  const { default: postgres } = await import("postgres");
  const sql = postgres(env.DATABASE_URL, { prepare: false, max: 1, connect_timeout: 10 });
  try {
    await sql`select 1`;
    ok("Connected");
    const [{ exists }] = await sql`select to_regclass('auth.users') is not null as exists`;
    if (!exists) warn("auth.users not found — is this a Supabase database?");
    await sql.end();
    const migrate = spawnSync("pnpm", ["exec", "drizzle-kit", "migrate"], {
      stdio: "pipe",
      encoding: "utf8",
    });
    if (migrate.status === 0) ok("Migrations applied");
    else {
      fail("Migrations failed:\n" + (migrate.stderr || migrate.stdout).trim());
      todo.push("Fix the migration error above and re-run");
    }
  } catch (error) {
    fail(`Could not connect: ${error.message}`);
    todo.push("Check DATABASE_URL (use the transaction pooler string, port 6543)");
    await sql.end({ timeout: 1 }).catch(() => {});
  }
} else warn("Skipped (DATABASE_URL not set)");

step("4. Anthropic");
if (env.ANTHROPIC_API_KEY) {
  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const model = await new Anthropic({ apiKey: env.ANTHROPIC_API_KEY }).models.retrieve(MODEL);
    ok(`API key works — ${model.display_name} (${model.id}) available`);
  } catch (error) {
    fail(`API key check failed: ${error.status ?? ""} ${error.message}`);
    todo.push("Check ANTHROPIC_API_KEY");
  }
} else warn("Skipped (ANTHROPIC_API_KEY not set)");

step("5. Supabase Auth");
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const projectRef = supabaseUrl ? new URL(supabaseUrl).hostname.split(".")[0] : undefined;
const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

if (env.SUPABASE_ACCESS_TOKEN && projectRef) {
  const redirectUrls = new Set([`${siteUrl}/auth/callback`, "http://localhost:3000/auth/callback"]);
  const body = { site_url: siteUrl, uri_allow_list: [...redirectUrls].join(",") };
  if (env.GOOGLE_OAUTH_CLIENT_ID && env.GOOGLE_OAUTH_CLIENT_SECRET) {
    Object.assign(body, {
      external_google_enabled: true,
      external_google_client_id: env.GOOGLE_OAUTH_CLIENT_ID,
      external_google_secret: env.GOOGLE_OAUTH_CLIENT_SECRET,
    });
  }
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  }).catch((error) => ({ ok: false, status: 0, text: async () => error.message }));
  if (res.ok) {
    ok(`Site URL set to ${siteUrl}`);
    ok(`Redirect URLs allowed: ${[...redirectUrls].join(", ")}`);
    if ("external_google_enabled" in body) ok("Google provider enabled");
  } else {
    fail(`Management API update failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  }
}

if (supabaseUrl && env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY && projectRef) {
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: { apikey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const settings = await res.json();
    if (settings.external?.email) ok("Email sign-in enabled");
    else fail("Email sign-in disabled");
    if (settings.external?.google) ok("Google sign-in enabled");
    else {
      fail("Google sign-in not enabled");
      todo.push(
        `Enable Google: https://supabase.com/dashboard/project/${projectRef}/auth/providers ` +
          `(Google Cloud redirect URI: ${supabaseUrl}/auth/v1/callback)`,
      );
    }
  } catch (error) {
    fail(`Could not reach Supabase Auth: ${error.message}`);
    todo.push("Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  }
  if (!env.SUPABASE_ACCESS_TOKEN) {
    todo.push(
      `Add redirect URL ${siteUrl}/auth/callback and set Site URL: ` +
        `https://supabase.com/dashboard/project/${projectRef}/auth/url-configuration ` +
        "(or set SUPABASE_ACCESS_TOKEN and re-run to do it automatically)",
    );
  }
} else warn("Skipped (Supabase URL or key not set)");

step(todo.length ? "Remaining steps:" : "All set. Run `pnpm dev` and open http://localhost:3000");
todo.forEach((t, i) => console.log(`  ${i + 1}. ${t}`));
process.exitCode = todo.length ? 1 : 0;
