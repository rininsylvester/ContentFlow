import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = publicEnv.NEXT_PUBLIC_SITE_URL;
  return ["", "/login", "/terms", "/privacy"].map((path) => ({ url: `${base}${path}` }));
}
