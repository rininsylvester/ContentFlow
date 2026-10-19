import type { IdeaExpansion, IdeasOutput } from "./schemas/ideas";
import type { ScriptOutput, ScriptSection } from "./schemas/script";
import type { TaskId } from "./models";

/**
 * Deterministic fake provider, enabled with AI_MOCK=1. Used for local
 * development without an API key and for end-to-end tests. Never set it in
 * production.
 */
const DIFFICULTY = ["easy", "medium", "hard"] as const;

const ideas: IdeasOutput = {
  ideas: Array.from({ length: 10 }, (_, i) => ({
    title: `Sample idea ${i + 1}: the 5-minute routine nobody talks about`,
    angle: "Show the routine in real time instead of explaining it.",
    hook: "I tried this for 30 days and here's what actually changed.",
    whyItWorks: "Real-time proof builds trust and the 30-day frame creates curiosity.",
    difficulty: DIFFICULTY[i % 3] ?? "easy",
  })),
};

const expansion: IdeaExpansion = {
  summary: "A fast, proof-driven walkthrough that shows the routine working in real life.",
  outline: ["Cold open with the result", "Why most routines fail", "The 5 steps", "Day 30 reveal"],
  keyPoints: ["Consistency beats intensity", "Five minutes is enough to start"],
  examples: ["Side-by-side of day 1 and day 30", "A viewer comment that inspired the test"],
  cta: "Comment 'ROUTINE' and I'll send you the checklist.",
};

const section = (i: number): ScriptSection => ({
  heading: i === 0 ? "Hook" : `Beat ${i}`,
  timestamp: `0:${String(i * 10).padStart(2, "0")}-0:${String(i * 10 + 10).padStart(2, "0")}`,
  script: `Sample script line for section ${i + 1}. Say this to camera with energy.`,
  bRoll: ["Close-up of hands", "Wide shot of the setup"],
  onScreenText: [`Step ${i + 1}`],
});

const script: ScriptOutput = {
  title: "Sample script: the 5-minute routine",
  hooks: [
    { text: "Stop doing this every morning.", style: "contrarian" },
    { text: "I tried this for 30 days.", style: "story" },
    { text: "Nobody talks about this 5-minute trick.", style: "curiosity gap" },
  ],
  sections: [0, 1, 2, 3].map(section),
  cta: "Follow for part two tomorrow.",
  estimatedDuration: "60 seconds",
};

const FIXTURES: Record<TaskId, unknown> = {
  ideas,
  "ideas-expand": expansion,
  script,
  "script-section": { ...section(1), script: "A rewritten, punchier version of this section." },
};

/**
 * Failure scenarios for tests: AI_MOCK_SCENARIO=invalid returns JSON that fails
 * validation; AI_MOCK_SCENARIO=error simulates a provider outage.
 */
export class MockProviderError extends Error {}

export async function mockCompletion(
  taskId: TaskId,
  signal: AbortSignal,
  onText: (text: string) => void,
): Promise<{ text: string; inputTokens: number; outputTokens: number; incomplete: boolean }> {
  const scenario = process.env.AI_MOCK_SCENARIO;
  if (scenario === "error") throw new MockProviderError("Simulated provider outage");
  const text = scenario === "invalid" ? '{"unexpected": true}' : JSON.stringify(FIXTURES[taskId]);
  const chunkSize = 40;
  for (let i = 0; i < text.length; i += chunkSize) {
    signal.throwIfAborted();
    onText(text.slice(i, i + chunkSize));
    await new Promise((resolve) => setTimeout(resolve, 8));
  }
  return { text, inputTokens: 500, outputTokens: Math.ceil(text.length / 4), incomplete: false };
}
