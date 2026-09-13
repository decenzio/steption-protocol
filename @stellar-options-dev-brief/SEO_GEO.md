# SEO and agent discovery

Configured September 11, 2026, for the user-confirmed canonical origin `https://steptionprotocol.com`.

## Implemented

- Route-specific titles, descriptions, canonical URLs, Open Graph and Twitter metadata.
- Branded 1200 × 630 PNG at `/opengraph-image`, generated locally by Next ImageResponse with an image description in the metadata. No runtime external image service is required.
- `/sitemap.xml` includes `/`, `/learn` and `/docs/api` in indexable production builds. No artificial last-modified dates are emitted.
- Production public pages permit indexing. `/app`, `/markets`, `/portfolio`, `/liquidity` and `/settlement` use noindex, follow. `/markets` points canonically to `/app`.
- Local development, Vercel preview and Netlify preview contexts are noindex. `SEO_INDEXING=false` disables indexing on other staging hosts. Preview sitemaps are empty.
- Organization JSON-LD identifies the existing publisher Decenzio and its Steption brand; WebSite JSON-LD identifies Steption. No registration details, ratings or audit claims are invented.
- Homepage and learning-page FAQ JSON-LD use the same content arrays as their visible FAQs and Markdown.
- Descriptive alt text identifies all three team portraits; payoff charts retain accessible SVG descriptions. Decorative marks are hidden from assistive technology.
- `/llms.txt` documents public resources, application boundaries and content usage preferences.
- `/robots.txt` declares `Content-Signal: ai-train=no, search=yes, ai-input=yes`, as requested. The same signal appears on negotiated pages and agent guidance. These are usage preferences, not technical access controls or a guarantee of crawler compliance.

## Agent discovery resources

The homepage sends RFC 8288 Link headers using registered relations:

```http
Link: </.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json", </docs/api>; rel="service-doc"; type="text/html", </openapi.json>; rel="service-desc"; type="application/vnd.oai.openapi+json", </llms.txt>; rel="describedby"; type="text/plain"
```

The API catalog uses RFC 9727 Linkset JSON and advertises the actual optional newsletter endpoint. OpenAPI 3.1 describes its method, request, same-origin constraint and error responses. No fictitious REST trading API is advertised; the browser app uses Stellar RPC and wallet signatures.

## Markdown and cache behavior

All current page routes support explicit `Accept: text/markdown` with normal HTTP quality values. Wildcard-only requests and browser HTML requests keep HTML. HEAD has the same representation headers without a body. RSC requests and POSTs remain under Next's normal handling.

Markdown responses send `Content-Type: text/markdown; charset=utf-8`, `Vary: Accept` alongside Next's RSC dimensions, and an estimated `x-markdown-tokens` count (document characters divided by four). The estimate is not a model-specific tokenizer count. Direct `/index.md`, `/learn.md`, `/docs/api.md` and app `.md` aliases also work and are noindex with canonical links back to their page URLs.

The homepage and learning Markdown preserve public protocol information and FAQs. App Markdown explicitly describes the interface: it does not expose browser-local paper positions, connected wallet data or a live market snapshot.

Next 16.3.4 overwrites a Proxy-provided Vary header while rendering HTML. The supplied `scripts/server.mjs` preserves Accept at the per-response Node boundary and retains Next's RSC and compression fields. Both `npm run dev` (and `./start.sh`) and `npm start` use it. No global framework patch or dependency modification is used.

Use a persistent Node-compatible host that runs `npm start`. If deploying with a platform's native Next adapter instead, configure its final response gateway to preserve `Vary: Accept` on HTML and Markdown and rerun the HTTP checks; such adapters may bypass the supplied server. Any CDN must honor these representation variants or bypass caching for negotiated pages. Do not silently replace `npm start` with `next start`.

## Production configuration

Set these before building, then restart/redeploy after changes:

```dotenv
SITE_URL=https://steptionprotocol.com
SEO_INDEXING=true
GOOGLE_SITE_VERIFICATION=
```

SITE_URL defaults to the confirmed domain and accepts a complete HTTP(S) origin only. Add the optional Search Console token if using HTML-tag property verification, or verify the domain through DNS. Public page metadata and sitemap are generated at build time; keep runtime settings consistent with build settings. The selected preview context still disables indexing when SEO_INDEXING is true.

After deploying the website, verify the domain in Google Search Console and submit `https://steptionprotocol.com/sitemap.xml`. A sitemap and schema enable discovery but cannot guarantee indexing, ranking, AI citations or rich results. No live indexing submission, external scanner run, DNS change or website deployment was performed here.

## Checks

```sh
npm test
npm run typecheck
npm run lint
npm run build

# Terminal 1: production build, default canonical domain
npm start -- --port 3014

# Terminal 2: read-only production acceptance
npm run test:seo -- http://127.0.0.1:3014 --indexable

# Or test your noindex local development server:
npm run test:seo -- http://127.0.0.1:3001
```

Production and development acceptance passed locally. Checks cover HTML/Markdown format selection and cache variants, HEAD, titles, canonicals, robots metadata and HTTP headers, FAQ/Organization JSON-LD, rendered image alt tags, sitemap scope, Content Signals, all linked agent resources and the PNG dimensions. The OG image was also visually inspected. Unit tests cover quality-value exclusions, preview indexing rules, shared FAQs and preservation of RSC and write handling. The GitHub Actions frontend job runs production HTTP acceptance after building.

## Source references

- [Link Headers skill](https://isitagentready.com/.well-known/agent-skills/link-headers/SKILL.md), [RFC 8288](https://www.rfc-editor.org/rfc/rfc8288), [RFC 9727](https://www.rfc-editor.org/rfc/rfc9727).
- [Markdown Negotiation skill](https://isitagentready.com/.well-known/agent-skills/markdown-negotiation/SKILL.md), [Cloudflare Markdown for Agents](https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/), [llms.txt](https://llmstxt.org/).
- [Content Signals skill](https://isitagentready.com/.well-known/agent-skills/content-signals/SKILL.md), [Content Signals](https://contentsignals.org/), [IETF Content Signals draft](https://datatracker.ietf.org/doc/draft-romm-aipref-contentsignals/).
- [Next Proxy](https://nextjs.org/docs/app/api-reference/file-conventions/proxy), [ImageResponse](https://nextjs.org/docs/app/api-reference/functions/image-response), [custom server](https://nextjs.org/docs/app/guides/custom-server).
- [Schema.org Organization](https://schema.org/Organization), [FAQPage](https://schema.org/FAQPage), [Google noindex guidance](https://developers.google.com/search/docs/crawling-indexing/block-indexing).
