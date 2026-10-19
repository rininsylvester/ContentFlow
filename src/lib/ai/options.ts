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
