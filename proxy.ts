import { NextRequest, NextResponse } from "next/server";
import { pageMarkdown, prefersMarkdown } from "./app/lib/markdown";
import {
  absoluteUrl,
  contentSignal,
  discoveryLinks,
  indexingAllowed,
  pages,
  type PagePath,
} from "./app/lib/seo";

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const directMarkdown = pathname.endsWith(".md");
  const path = (
    pathname === "/index.md"
      ? "/"
      : directMarkdown
        ? pathname.slice(0, -3)
        : pathname
  ) as PagePath;
  if (!Object.hasOwn(pages, path) || !["GET", "HEAD"].includes(request.method))
    return NextResponse.next();
  const rscRequest = request.headers.get("rsc") === "1";
  const markdown =
    !rscRequest &&
    (directMarkdown || prefersMarkdown(request.headers.get("accept")));
  const response = markdown
    ? new NextResponse(request.method === "HEAD" ? null : pageMarkdown(path))
    : NextResponse.next();
  if (markdown) {
    response.headers.set("Content-Type", "text/markdown; charset=utf-8");
    response.headers.set(
      "X-Markdown-Tokens",
      String(Math.ceil(pageMarkdown(path).length / 4)),
    );
    response.headers.set("Cache-Control", "public, max-age=0, must-revalidate");
    response.headers.set("X-Content-Type-Options", "nosniff");
  }
  // Keep Next's RSC variants separate as well as our HTML/Markdown variants.
  response.headers.append(
    "Vary",
    "Accept, RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Url",
  );
  response.headers.set("Content-Signal", contentSignal);
  response.headers.set(
    "Link",
    `${discoveryLinks()}, <${absoluteUrl(path === "/markets" ? "/app" : path)}>; rel="canonical"`,
  );
  if (directMarkdown || !indexingAllowed() || !pages[path].index)
    response.headers.set("X-Robots-Tag", "noindex, follow");
  return response;
}

export const config = {
  matcher: [
    "/",
    "/learn",
    "/docs/api",
    "/app",
    "/markets",
    "/portfolio",
    "/liquidity",
    "/settlement",
    "/index.md",
    "/learn.md",
    "/docs/api.md",
    "/app.md",
    "/markets.md",
    "/portfolio.md",
    "/liquidity.md",
    "/settlement.md",
  ],
};
