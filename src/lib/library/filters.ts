import { z } from "zod";
import { TOOLS, type Tool } from "@/lib/db/schema/enums";

export const PAGE_SIZE = 24;
const MAX_LIMIT = PAGE_SIZE * 10;

const first = (v: unknown) => (Array.isArray(v) ? v[0] : v);

const paramsSchema = z.object({
  q: z.preprocess(first, z.string().trim().max(200).optional().catch(undefined)),
  tool: z.preprocess(first, z.enum(TOOLS).optional().catch(undefined)),
  tag: z.preprocess(first, z.string().trim().toLowerCase().max(40).optional().catch(undefined)),
  fav: z.preprocess(first, z.literal("1").optional().catch(undefined)),
  limit: z.preprocess(
    first,
    z.coerce.number().int().min(PAGE_SIZE).max(MAX_LIMIT).optional().catch(undefined),
  ),
});

export type ParsedLibraryParams = {
  q?: string;
  tool?: Tool;
  tag?: string;
  favorites: boolean;
  limit: number;
};

/** Parse untrusted URL search params; invalid values are ignored rather than erroring. */
export function parseLibraryParams(
  raw: Record<string, string | string[] | undefined>,
): ParsedLibraryParams {
  const p = paramsSchema.parse(raw);
  return {
    q: p.q || undefined,
    tool: p.tool,
    tag: p.tag || undefined,
    favorites: p.fav === "1",
    limit: p.limit ?? PAGE_SIZE,
  };
}

export function libraryHref(params: Partial<ParsedLibraryParams>): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.tool) sp.set("tool", params.tool);
  if (params.tag) sp.set("tag", params.tag);
  if (params.favorites) sp.set("fav", "1");
  if (params.limit && params.limit !== PAGE_SIZE) sp.set("limit", String(params.limit));
  const qs = sp.toString();
  return qs ? `/library?${qs}` : "/library";
}
