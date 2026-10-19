/** Option lists shared by forms (client) and schemas (server). Keep this file dependency-free. */

export const PLATFORMS = [
  "YouTube",
  "YouTube Shorts",
  "TikTok",
  "Instagram Reels",
  "Instagram",
  "Podcast",
  "Blog",
  "LinkedIn",
  "X / Threads",
] as const;

export const GOALS = ["grow", "sell", "educate", "entertain"] as const;
export const GOAL_LABELS: Record<(typeof GOALS)[number], string> = {
  grow: "Grow my audience",
  sell: "Sell a product or service",
  educate: "Educate",
  entertain: "Entertain",
};

export const DIFFICULTIES = ["easy", "medium", "hard"] as const;

export const SCRIPT_FORMATS = ["short-form", "long-form", "podcast", "blog"] as const;
export const SCRIPT_FORMAT_LABELS: Record<(typeof SCRIPT_FORMATS)[number], string> = {
  "short-form": "Short-form vertical",
  "long-form": "Long-form YouTube",
  podcast: "Podcast outline",
  blog: "Blog post",
};

export const SCRIPT_LENGTHS = ["15s", "60s", "3-5min", "10min+"] as const;
export const SCRIPT_LENGTH_LABELS: Record<(typeof SCRIPT_LENGTHS)[number], string> = {
  "15s": "15 seconds",
  "60s": "60 seconds",
  "3-5min": "3–5 minutes",
  "10min+": "10+ minutes",
};

export const TONE_SUGGESTIONS = [
  "Energetic",
  "Friendly and casual",
  "Authoritative",
  "Funny",
  "Calm and thoughtful",
  "Inspirational",
] as const;

export const HOOK_FRAMEWORKS = [
  "curiosity-gap",
  "contrarian",
  "listicle",
  "story",
  "how-to",
] as const;
export const HOOK_FRAMEWORK_LABELS: Record<(typeof HOOK_FRAMEWORKS)[number], string> = {
  "curiosity-gap": "Curiosity gap",
  contrarian: "Contrarian",
  listicle: "Listicle",
  story: "Story",
  "how-to": "How-to",
};

export const SEARCH_INTENTS = [
  "informational",
  "navigational",
  "commercial",
  "transactional",
] as const;

export const REPURPOSE_FORMATS = [
  { key: "shortCaption", label: "TikTok / Reels caption" },
  { key: "youtubeDescription", label: "YouTube description" },
  { key: "thread", label: "X / Threads thread" },
  { key: "linkedinPost", label: "LinkedIn post" },
  { key: "newsletterBlurb", label: "Newsletter blurb" },
] as const;
