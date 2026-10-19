import { productionConfigProblems } from "@/lib/env-check";

/** Runs once when a server instance starts. Logs configuration problems loudly in production. */
export function register() {
  if (process.env.NODE_ENV !== "production") return;
  const problems = productionConfigProblems(process.env);
  if (problems.length === 0) return;
  console.error(
    `[config] CreatorHub is not fully configured for production:\n${problems.map((p) => `  - ${p}`).join("\n")}`,
  );
}
