import type { MetadataRoute } from "next";
import { absoluteUrl, indexingAllowed, publicPaths } from "./lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  // No invented modification dates or wallet-specific routes.
  return indexingAllowed()
    ? publicPaths.map((path) => ({ url: absoluteUrl(path) }))
    : [];
}
