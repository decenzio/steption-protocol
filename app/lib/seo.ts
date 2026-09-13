import type { Metadata } from "next";

const configuredUrl = new URL(
  process.env.SITE_URL || "https://steptionprotocol.com",
);
if (
  !["http:", "https:"].includes(configuredUrl.protocol) ||
  configuredUrl.username ||
  configuredUrl.password ||
  configuredUrl.pathname !== "/" ||
  configuredUrl.search ||
  configuredUrl.hash
) {
  throw new Error(
    "SITE_URL must be an HTTP(S) origin without credentials, a path, query or fragment.",
  );
}
export const siteUrl = configuredUrl.origin;
export const absoluteUrl = (path: string) => new URL(path, `${siteUrl}/`).href;
export const contentSignal = "ai-train=no, search=yes, ai-input=yes";

// Preview hosting and local development must not compete with the public site.
export function indexingAllowed(env: NodeJS.ProcessEnv = process.env) {
  return (
    env.NODE_ENV === "production" &&
    env.SEO_INDEXING !== "false" &&
    (!env.VERCEL_ENV || env.VERCEL_ENV === "production") &&
    (!env.CONTEXT || env.CONTEXT === "production")
  );
}

export const pages = {
  "/": {
    title: "Steption | XLM Options on Stellar",
    description:
      "Explore collateralized XLM puts and capped calls on Stellar. Learn how Steption works and try the Testnet options app with local paper trading.",
    index: true,
  },
  "/learn": {
    title: "How Stellar Options Work | Steption",
    description:
      "Learn how Steption's XLM puts, capped calls, fixed premiums, collateral and historical oracle settlement work on Stellar Testnet.",
    index: true,
  },
  "/docs/api": {
    title: "API & Agent Documentation | Steption",
    description:
      "Discover Steption's API catalog, Markdown pages, content policy and optional newsletter endpoint. Trading uses Stellar RPC and wallet signatures.",
    index: true,
  },
  "/app": {
    title: "XLM Options Markets | Steption Testnet",
    description:
      "Compare XLM puts and capped calls by strike, expiry and premium. Explore paper trades or connect Freighter to a configured Stellar Testnet deployment.",
    index: false,
  },
  "/markets": {
    title: "XLM Options Markets | Steption Testnet",
    description:
      "Browse collateralized XLM option offers on Steption. Review exact terms, capped payouts and available inventory before a Testnet trade.",
    index: false,
  },
  "/portfolio": {
    title: "Your Options Portfolio | Steption",
    description:
      "Track Steption paper trades or your connected Testnet wallet's option positions, premiums and settlement claims.",
    index: false,
  },
  "/liquidity": {
    title: "Write Collateralized XLM Options | Steption",
    description:
      "Set fixed premiums and reserve collateral for XLM puts and capped calls on Stellar Testnet. Manage your unsold option inventory.",
    index: false,
  },
  "/settlement": {
    title: "Option Settlement & Claims | Steption",
    description:
      "Settle expired Steption option series using historical oracle observations and claim buyer payouts or writer collateral on Stellar Testnet.",
    index: false,
  },
} as const;
export type PagePath = keyof typeof pages;
export const publicPaths = Object.keys(pages).filter(
  (path) => pages[path as PagePath].index,
) as PagePath[];

export function pageMetadata(path: PagePath): Metadata {
  const page = pages[path];
  const canonical = path === "/markets" ? "/app" : path;
  const image = {
    url: absoluteUrl("/opengraph-image"),
    width: 1200,
    height: 630,
    alt: "Steption — XLM options on Stellar. Puts, capped calls and fixed premiums. Testnet development release.",
  };
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: absoluteUrl(canonical) },
    robots: {
      index: indexingAllowed() && page.index,
      follow: true,
      googleBot: {
        index: indexingAllowed() && page.index,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "website",
      siteName: "Steption",
      locale: "en_US",
      url: absoluteUrl(canonical),
      title: page.title,
      description: page.description,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      images: [image],
    },
  };
}

export function discoveryLinks() {
  return [
    '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"',
    '</docs/api>; rel="service-doc"; type="text/html"',
    '</openapi.json>; rel="service-desc"; type="application/vnd.oai.openapi+json"',
    '</llms.txt>; rel="describedby"; type="text/plain"',
  ].join(", ");
}
