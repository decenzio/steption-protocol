import { absoluteUrl, contentSignal, indexingAllowed } from "../lib/seo";

export const dynamic = "force-static";
export function GET() {
  const allowed = indexingAllowed();
  const lines = [
    "# Content usage preferences: https://contentsignals.org/",
    "User-agent: *",
    `Content-Signal: ${contentSignal}`,
    ...(allowed ? ["Allow: /", "Disallow: /api/"] : ["Disallow: /"]),
    // App pages remain crawlable in production so crawlers can see noindex.
    "",
    ...(allowed ? [`Sitemap: ${absoluteUrl("/sitemap.xml")}`] : []),
    "",
  ];
  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Signal": contentSignal,
    },
  });
}
