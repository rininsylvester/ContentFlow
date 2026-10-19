import type { IdeaExpansion, IdeasOutput } from "./schemas/ideas";
import type { AestheticsOutput } from "./schemas/aesthetics";
import type { HooksOutput } from "./schemas/hooks";
import type { RepurposeOutput } from "./schemas/repurpose";
import type { ScriptOutput, ScriptSection } from "./schemas/script";
import type { SeoOutput } from "./schemas/seo";
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

const FRAMEWORKS = ["curiosity-gap", "contrarian", "listicle", "story", "how-to"] as const;
const hooks: HooksOutput = {
  hooks: Array.from({ length: 15 }, (_, i) => ({
    text: `Sample hook ${i + 1}: nobody tells beginners this`,
    framework: FRAMEWORKS[i % 5] ?? "story",
    reason: "Creates an information gap the viewer wants closed.",
    score: 10 - (i % 6),
  })),
};

const seo: SeoOutput = {
  primaryKeyword: "home espresso for beginners",
  searchIntent: "informational",
  secondaryKeywords: ["espresso at home", "best beginner espresso machine", "how to pull a shot"],
  longTailKeywords: [
    "how to make espresso at home without a machine",
    "espresso grind size for beginners",
    "cheap espresso setup under 300",
  ],
  optimizedTitle: "Home Espresso for Beginners: Pull Your First Great Shot",
  description:
    "Learn home espresso from scratch. In this guide you'll set up, dial in and pull your first great shot.",
  tags: ["espresso", "home barista", "coffee", "espresso tutorial"],
  hashtags: { broad: ["#coffee", "#espresso"], niche: ["#homebarista", "#espressoathome"] },
};

const aesthetics: AestheticsOutput = {
  palette: [
    { hex: "#1F1A17", name: "Roast", role: "text" },
    { hex: "#F4EDE4", name: "Oat milk", role: "background" },
    { hex: "#C8742B", name: "Caramel", role: "primary" },
    { hex: "#6B8F71", name: "Sage", role: "accent" },
    { hex: "#E9B44C", name: "Honey", role: "highlight" },
  ],
  fontPairings: [
    {
      heading: "Playfair Display",
      body: "Inter",
      why: "Editorial warmth with a clean, readable body.",
    },
    {
      heading: "DM Serif Display",
      body: "DM Sans",
      why: "A matched family that feels cozy but modern.",
    },
  ],
  visualStyle: "Warm, film-inspired look with soft grain, slow pacing and natural textures.",
  lighting: ["Window light from 45 degrees", "Warm practical lamp in the background"],
  camera: ["35mm lens at eye level", "Slow push-ins on key moments"],
  thumbnails: [
    {
      concept: "Before and after",
      layout: "Split frame",
      text: "Worst to best shot",
      expression: "Surprised",
      contrast: "Dark left, bright right",
    },
    {
      concept: "Close-up pour",
      layout: "Centered subject",
      text: "Do this first",
      expression: "Focused",
      contrast: "Caramel on deep brown",
    },
  ],
  shotList: [
    { shot: "Beans pouring into grinder", purpose: "Opening texture" },
    { shot: "Tamping close-up", purpose: "Show technique" },
    { shot: "Extraction slow motion", purpose: "Payoff" },
    { shot: "Talking head by the window", purpose: "Explain the steps" },
  ],
};

const repurpose: RepurposeOutput = {
  shortCaption: "Your mornings are about to change. Save this for tomorrow. #routine #productivity",
  youtubeDescription:
    "The 5-minute routine nobody talks about.\n\nIn this video I break down the exact steps.",
  thread: [
    "I tried a 5-minute morning routine for 30 days. Here's what happened:",
    "Day 1 was rough.",
    "By day 30 it was automatic. Would you try it?",
  ],
  linkedinPost:
    "Five minutes changed my mornings.\n\nHere's the routine, and what I learned.\n\nWhat's yours?",
  newsletterBlurb:
    "This week: the five-minute routine that stuck when nothing else did, and why it works.",
};

const FIXTURES: Record<TaskId, unknown> = {
  hooks,
  seo,
  aesthetics,
  repurpose,
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
