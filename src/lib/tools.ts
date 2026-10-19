import {
  CalendarDays,
  Captions,
  Lightbulb,
  Library,
  Palette,
  PenLine,
  Search,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
  examples?: readonly string[];
};

/** Generation tools, in sidebar order. */
export const TOOL_NAV: readonly NavItem[] = [
  {
    id: "ideas",
    label: "Idea Generator",
    href: "/ideas",
    icon: Lightbulb,
    description: "10 content ideas with hooks, angles and difficulty.",
    examples: [
      "Fitness tips for busy moms on TikTok",
      "Budget travel in Southeast Asia for YouTube",
      "Productivity hacks for remote developers on Instagram",
    ],
  },
  {
    id: "script",
    label: "Script Writer",
    href: "/scripts",
    icon: PenLine,
    description: "Structured scripts with hooks, B-roll and on-screen text.",
    examples: [
      "60s TikTok: 3 mistakes beginners make lifting weights",
      "10-minute YouTube video on meal prep for the week",
      "Podcast outline: how I grew a newsletter to 10k subscribers",
    ],
  },
  {
    id: "hooks",
    label: "Hook & Title Lab",
    href: "/hooks",
    icon: Sparkles,
    description: "15 scroll-stopping hooks and titles across proven frameworks.",
    examples: [
      "Why most people fail at learning a language",
      "My first year as a full-time creator",
      "How to edit videos 2x faster",
    ],
  },
  {
    id: "seo",
    label: "SEO & Keywords",
    href: "/seo",
    icon: Search,
    description: "Keywords, optimized titles, descriptions, tags and hashtags.",
    examples: [
      "Home espresso for beginners — YouTube",
      "Sourdough starter troubleshooting — blog",
      "Minimalist wardrobe — Instagram",
    ],
  },
  {
    id: "aesthetics",
    label: "Aesthetics Studio",
    href: "/aesthetics",
    icon: Palette,
    description: "Palettes, font pairings, mood, lighting and thumbnail concepts.",
    examples: [
      "Cozy, warm, film-grain — cooking channel on YouTube",
      "Bold, neon, high-energy — gaming on TikTok",
      "Calm, airy, neutral — wellness on Instagram",
    ],
  },
  {
    id: "repurpose",
    label: "Caption & Repurposer",
    href: "/repurpose",
    icon: Captions,
    description: "Turn one script into captions, threads, posts and newsletters.",
    examples: [
      "Paste a YouTube script to get a LinkedIn post and X thread",
      "Turn a blog post into a TikTok caption",
    ],
  },
];

/** Planning + library sections, below the tools. */
export const WORKSPACE_NAV: readonly NavItem[] = [
  {
    id: "calendar",
    label: "Content Calendar",
    href: "/calendar",
    icon: CalendarDays,
    description: "Plan saved ideas by date and track their status.",
  },
  {
    id: "library",
    label: "Library",
    href: "/library",
    icon: Library,
    description: "Everything you've saved, searchable and filterable.",
  },
];

export function findNavItem(id: string): NavItem {
  const item = [...TOOL_NAV, ...WORKSPACE_NAV].find((t) => t.id === id);
  if (!item) throw new Error(`Unknown nav item: ${id}`);
  return item;
}
