import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Integration tests run against a real Postgres database with the migrations
 * applied and the AI provider mocked. Set TEST_DATABASE_URL to enable them.
 * The database must have Supabase's `auth.users` table (local Supabase, or the
 * stub in tests/integration/supabase-stub.sql).
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./tests/stubs/server-only.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    fileParallelism: false,
    testTimeout: 30_000,
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? "",
      AI_MOCK: "1",
    },
  },
});
