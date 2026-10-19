import { z } from "zod";
import { PLATFORMS } from "../options";

export { PLATFORMS };

export const platformSchema = z.enum(PLATFORMS);
export type Platform = z.infer<typeof platformSchema>;

/** Free-text field: trimmed, bounded, non-empty. */
export const text = (min: number, max: number) => z.string().trim().min(min).max(max);
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));
