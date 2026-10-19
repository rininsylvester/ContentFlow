import { z } from "zod";
import { platformSchema, text } from "./common";

export const aestheticsInputSchema = z.object({
  niche: text(2, 120),
  vibe: text(2, 200),
  platform: platformSchema,
});
export type AestheticsInput = z.infer<typeof aestheticsInputSchema>;

export const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export const aestheticsOutputSchema = z.object({
  palette: z
    .array(
      z.object({
        hex: z.string().regex(HEX_COLOR),
        name: z.string(),
        role: z.string(),
      }),
    )
    .min(5),
  fontPairings: z
    .array(z.object({ heading: z.string(), body: z.string(), why: z.string() }))
    .min(2),
  visualStyle: z.string(),
  lighting: z.array(z.string()).min(1),
  camera: z.array(z.string()).min(1),
  thumbnails: z
    .array(
      z.object({
        concept: z.string(),
        layout: z.string(),
        text: z.string(),
        expression: z.string(),
        contrast: z.string(),
      }),
    )
    .min(2),
  shotList: z.array(z.object({ shot: z.string(), purpose: z.string() })).min(4),
});
export type AestheticsOutput = z.infer<typeof aestheticsOutputSchema>;
