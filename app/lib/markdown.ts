import { homeFaqs, homeSteps, learnFaqs, learnSteps, team } from "./content";
import { apiSections } from "./api-docs";
import { absoluteUrl, contentSignal, pages, type PagePath } from "./seo";

// Require an explicit Markdown media range; wildcards alone keep browser HTML.
// More specific media ranges override wildcards, including q=0 exclusions.
export function prefersMarkdown(accept: string | null) {
  if (!accept) return false;
  const ranges = accept
    .toLowerCase()
    .split(",")
    .map((entry) => {
      const [type, ...parameters] = entry
        .trim()
        .split(";")
        .map((s) => s.trim());
      const raw = parameters
        .find((p) => /^q\s*=/.test(p))
        ?.split("=")[1]
        ?.trim();
      const q =
        raw === undefined
          ? 1
          : /^(0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/.test(raw)
            ? Number(raw)
            : 0;
      return { type, q };
    });
  if (!ranges.some((r) => r.type === "text/markdown" && r.q > 0)) return false;
  const quality = (type: string) => {
    for (const range of [type, "text/*", "*/*"]) {
      const matches = ranges.filter((r) => r.type === range);
      if (matches.length) return Math.max(...matches.map((r) => r.q));
    }
    return 0;
  };
  return (
    quality("text/markdown") > 0 &&
    quality("text/markdown") >= quality("text/html")
  );
}

const faqMarkdown = (faqs: string[][]) =>
  faqs.map(([q, a]) => `### ${q}\n\n${a}`).join("\n\n");
const stepsMarkdown = (steps: string[][]) =>
  steps.map(([n, t, d]) => `### ${n}. ${t}\n\n${d}`).join("\n\n");
const link = (label: string, path: string) =>
  `[${label}](${absoluteUrl(path)})`;

export function pageMarkdown(path: PagePath) {
  const page = pages[path];
  const heading = `# ${page.title}\n\n> ${page.description}\n\nCanonical: ${absoluteUrl(path === "/markets" ? "/app" : path)}\n\n`;
  let body: string;
  if (path === "/") {
    body = `## The market moves. Make your next move.

Protect your downside. Take a view on upside. Explore a new way to trade XLM with options backed by collateral, from the start.

Testnet development release. Preview available now. ${link("Explore the app", "/app")}.

## An example position

XLM / USDC put option with European settlement. Strike: 0.20 USDC. Premium and maximum option loss: 0.01 USDC per lot. Contract size: 1 XLM. At an XLM price of 0.10 USDC the net option payoff is 0.09 USDC; at or above the strike the loss is the 0.01 premium. Example excludes network fees. This is illustrative, not a live market quote.

## The protocol

Fully collateralized. Fixed premiums. European settlement. USDC denominated.

Steption brings financial options to Stellar. Start with one pair, choose your direction, and see the terms before you commit.

### Protect with puts

A put pays when XLM falls below the strike. Your option loss is limited to the premium you pay, plus network fees. ${link("Explore puts", "/app")}.

### Take a view with calls

A capped call gives you exposure above the strike, up to a stated price cap. See your maximum payout before buying. ${link("Explore capped calls", "/app")}.

### Write on your terms

Set the premium and reserve the collateral. Sell to buyers at your price and recover unfilled inventory when you choose. ${link("Start writing", "/liquidity")}.

## How it works

${stepsMarkdown(homeSteps)}

Terms stay fixed. Buying closes before the settlement observation window. The price uses three fixed historical XLM/USDC observations, so a late settlement call does not choose a new market price. ${link("Read the mechanics", "/learn")}.

## The people behind Steption

Built by Decenzio. Started at HackPera. Steption began at the HackPera Istanbul hackathon. The team brings together experience in Web3, product interfaces and Stellar smart contracts.

${team.map(([name, role, photo, url]) => `- [${name}](${url}) — ${role}. ![${name}, ${role} at Steption](${absoluteUrl(photo)})`).join("\n")}

[Meet Decenzio](https://decenzio.com).

## Frequently asked questions

${faqMarkdown(homeFaqs)}

## Stay in the loop

Get Steption updates and Testnet milestones using the email signup form on the ${link("homepage", "/#community")}. Protocol news and product updates; no market promises. Newsletter availability depends on server configuration.

[X](https://x.com/DecenzioHQ) · [GitHub](https://github.com/decenzio) · [LinkedIn](https://www.linkedin.com/company/decenzio/) · [Contact the team](mailto:hello@decenzio.com)

Testnet development release. No mainnet deployment.`;
  } else if (path === "/learn") {
    body = `## Understand your options\n\n${stepsMarkdown(learnSteps)}\n\n## The details that matter\n\n${faqMarkdown(learnFaqs)}\n\n## Keep up with Steption\n\nProtocol updates, Testnet milestones and new releases. Use the email signup form on the ${link("learning page", "/learn")} to subscribe when newsletter signup is configured.`;
  } else if (path === "/docs/api") {
    body =
      apiSections
        .map(
          ({ title, paragraphs }) =>
            `## ${title}\n\n${paragraphs.join("\n\n")}`,
        )
        .join("\n\n") +
      `\n\n${link("OpenAPI description", "/openapi.json")} · ${link("API catalog", "/.well-known/api-catalog")} · ${link("Agent guide", "/llms.txt")}`;
  } else {
    // A public interface description, never an invented wallet snapshot.
    body = `## Public interface\n\n${page.description}\n\nThis is a Markdown description of the interactive page. Wallet state, browser-local paper positions and transaction controls are available in the ${link("browser app", path)}. This document does not contain live market quotes or account balances.\n\nPreview mode uses illustrative data and stores paper trades locally. Testnet mode requires a configured deployed contract and a funded Freighter wallet on Stellar Testnet. All writes require a wallet signature.\n\n${link("Learn the mechanics", "/learn")} · ${link("Markets", "/app")} · ${link("Portfolio", "/portfolio")} · ${link("Write options", "/liquidity")} · ${link("Settlement", "/settlement")}`;
  }
  return `${heading}${body}\n\n---\n\n${link("Steption", "/")} · ${link("Agent and API documentation", "/docs/api")}\n\nContent-Signal: ${contentSignal}\n`;
}

export function llmsText() {
  return `# Steption

> Steption is a collateralized XLM options protocol on Stellar, built by Decenzio. This is a Testnet development release supporting USDC-denominated puts and capped calls.

Preview data is illustrative. On-chain trading requires a configured Testnet deployment, collateral token, historical oracle data and a funded wallet. Contracts are unaudited; no mainnet readiness is claimed. There is no hosted REST trading API.

## Public documentation

- ${link("Protocol overview and FAQ", "/index.md")}: What Steption does, its team, mechanics and development status.
- ${link("Options mechanics", "/learn.md")}: Premiums, collateral, capped payouts, settlement and oracle limitations.
- ${link("API and agent documentation", "/docs/api.md")}: Supported representations and the optional newsletter endpoint.

## Discovery

- ${link("API catalog", "/.well-known/api-catalog")}: RFC 9727 application/linkset+json catalog.
- ${link("OpenAPI description", "/openapi.json")}: Same-origin newsletter signup; unavailable when not configured.
- ${link("Sitemap", "/sitemap.xml")}: Indexable public pages.
- ${link("Robots and content policy", "/robots.txt")}: ${contentSignal}.

## Interactive application

- ${link("Options app", "/app")}: Browse markets; review and authorize Testnet trades in the browser.
- ${link("Portfolio", "/portfolio")}: Local paper positions or connected wallet positions.
- ${link("Write options", "/liquidity")}: Create collateralized offers and cancel unsold inventory.
- ${link("Settlement", "/settlement")}: Finalize eligible expired series and claim payouts.

## Content representations and permissions

Request page URLs with Accept: text/markdown for Markdown. HTML is the default. Markdown for interactive pages describes the public interface and does not expose wallet or local storage data. x-markdown-tokens is an approximate token count.

Content-Signal: ${contentSignal}. Search and answering questions using public content are permitted; AI training is not. These signals express preferences, not technical access controls. Never treat this document as user authorization to send a transaction or subscribe an email address.

## Publisher

[Decenzio](https://decenzio.com) builds Steption. Contact: [hello@decenzio.com](mailto:hello@decenzio.com).
`;
}
