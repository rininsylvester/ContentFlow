/** Single source of truth for plan limits and pricing. */
export const PLAN = {
  name: "CreatorHub Pro",
  priceUsdMonthly: 5,
  trialGenerations: 5,
  monthlyGenerationCap: 400,
} as const;
