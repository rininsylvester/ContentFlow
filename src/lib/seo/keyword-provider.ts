import type { SeoInput, SeoOutput } from "@/lib/ai/schemas/seo";

/**
 * Pluggable source of real keyword metrics. The default provider returns no
 * data, so every keyword is clearly labelled as AI-suggested. To add live data
 * (e.g. a keyword API), implement KeywordProvider and return it from
 * getKeywordProvider() — nothing else needs to change.
 */
export type KeywordMetrics = {
  /** Monthly search volume, if the provider knows it. */
  volume: number | null;
  /** 0-100 ranking difficulty, if the provider knows it. */
  difficulty: number | null;
};

export interface KeywordProvider {
  readonly id: string;
  readonly label: string;
  lookup(keywords: string[], platform: string): Promise<Record<string, KeywordMetrics>>;
}

export const aiSuggestedProvider: KeywordProvider = {
  id: "ai",
  label: "AI-suggested — not live search-volume data",
  lookup: async () => ({}),
};

export function getKeywordProvider(): KeywordProvider {
  return aiSuggestedProvider;
}

export type KeywordData = {
  source: string;
  label: string;
  metrics: Record<string, KeywordMetrics>;
};

export type SeoResult = SeoOutput & { keywordData: KeywordData };

export async function enrichSeo(
  output: SeoOutput,
  input: SeoInput,
  provider: KeywordProvider = getKeywordProvider(),
): Promise<SeoResult> {
  const keywords = [output.primaryKeyword, ...output.secondaryKeywords, ...output.longTailKeywords];
  let metrics: Record<string, KeywordMetrics> = {};
  try {
    metrics = await provider.lookup(keywords, input.platform);
  } catch (error) {
    // Metrics are a bonus; never fail a paid generation because a lookup failed.
    console.error(`[seo] keyword provider "${provider.id}" failed`, error);
  }
  return { ...output, keywordData: { source: provider.id, label: provider.label, metrics } };
}
