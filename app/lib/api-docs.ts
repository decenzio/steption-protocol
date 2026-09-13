import { absoluteUrl, contentSignal, siteUrl } from "./seo";

export const apiSections = [
  {
    title: "What this site exposes",
    paragraphs: [
      "Steption is a Stellar options development release. Its only application HTTP API is an optional newsletter signup endpoint. There is no hosted REST trading API: markets and positions are read from the configured Soroban contract through Stellar RPC, and transactions require a user's wallet signature.",
      "Preview mode uses illustrative data and stores paper positions in the browser. Testnet trading requires deployed contracts, a configured oracle and collateral token, and a funded Freighter wallet on Stellar Testnet. Agent documentation does not grant permission to sign transactions or subscribe an email address.",
    ],
  },
  {
    title: "Agent discovery",
    paragraphs: [
      "The homepage advertises /.well-known/api-catalog (RFC 9727 Linkset JSON), /openapi.json (OpenAPI 3.1), /docs/api (these service docs), and /llms.txt through RFC 8288 Link response headers.",
      "GET the API catalog to discover service descriptions. The newsletter can be unavailable when its server credentials are not configured; inclusion in the catalog does not imply that signup is currently enabled.",
    ],
  },
  {
    title: "Markdown representations",
    paragraphs: [
      "Request a page with Accept: text/markdown to receive text/markdown; charset=utf-8. HTML remains the default. Explicit quality values are respected, and Vary: Accept keeps the formats separate in caches. x-markdown-tokens is an estimate based on document length, not a model-specific tokenizer.",
      "The homepage, learning page, these docs and app routes support Markdown. Direct links /index.md, /learn.md and /docs/api.md also work. App Markdown describes the public interface; browser-local paper trades and connected wallet state are not exposed. Use the browser app for live balances, exact trade terms and confirmations.",
    ],
  },
  {
    title: "Newsletter signup",
    paragraphs: [
      "POST /api/newsletter/subscribe with Content-Type: application/json and a JSON body containing email. The Origin header must match the request Host, including the port locally. This is an opt-in endpoint for the site's forms, not a cross-origin mailing API. Only submit an address when its owner has explicitly requested a subscription.",
      "The endpoint accepts email strings up to 254 characters. When signup is configured, it rejects request text longer than 1,024 characters and invalid email syntax. A successful request returns 200 with a message. Errors return an error string: 400 invalid input, 403 invalid or missing Origin, 413 oversized request, or 503 unavailable configuration or provider. Duplicate addresses are handled without creating another subscriber.",
    ],
  },
  {
    title: "Content usage and indexing",
    paragraphs: [
      `Content-Signal: ${contentSignal}. Search indexing and using public content to answer questions are permitted; training AI models is not permitted under this signal. Content Signals express preferences and do not authenticate clients or enforce access control.`,
      "The sitemap contains public information pages. Portfolio, market, writer and settlement screens are marked noindex. Local development and preview deployments are also marked noindex. Content preferences apply independently of these deployment-specific indexing controls.",
    ],
  },
] as const;

export function apiCatalog() {
  return {
    linkset: [
      {
        anchor: absoluteUrl("/api/newsletter/subscribe"),
        "service-desc": [
          {
            href: absoluteUrl("/openapi.json"),
            type: "application/vnd.oai.openapi+json",
          },
        ],
        "service-doc": [{ href: absoluteUrl("/docs/api"), type: "text/html" }],
      },
    ],
  };
}

export function openApiDocument() {
  const errorContent = {
    "application/json": {
      schema: {
        type: "object",
        required: ["error"],
        properties: { error: { type: "string" } },
      },
    },
  };
  return {
    openapi: "3.1.0",
    info: {
      title: "Steption website API",
      version: "0.2.0",
      description:
        "Optional, same-origin newsletter signup. No REST trading endpoints are provided. Obtain the email owner's explicit consent before subscribing.",
      contact: {
        name: "Decenzio",
        url: "https://decenzio.com",
        email: "hello@decenzio.com",
      },
    },
    servers: [{ url: siteUrl }],
    externalDocs: { url: absoluteUrl("/docs/api") },
    paths: {
      "/api/newsletter/subscribe": {
        post: {
          operationId: "subscribeToNewsletter",
          summary: "Subscribe an email address to Steption updates",
          description:
            "Requires explicit subscriber consent and a same-origin Origin header. Returns 503 if server-only newsletter configuration is absent. Not a cross-origin public API.",
          parameters: [
            {
              name: "Origin",
              in: "header",
              required: true,
              description:
                "Must have the same host and port as the request URL.",
              schema: { type: "string", format: "uri" },
              example: siteUrl,
            },
          ],
          requestBody: {
            required: true,
            description:
              "Request text must be no more than 1,024 characters when signup is configured.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email"],
                  properties: {
                    email: { type: "string", format: "email", maxLength: 254 },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Subscribed, or address already subscribed.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["message"],
                    properties: { message: { type: "string" } },
                  },
                },
              },
            },
            "400": {
              description:
                "Invalid email, malformed body or processing failure.",
              content: errorContent,
            },
            "403": {
              description:
                "Origin is missing, malformed or does not match Host.",
              content: errorContent,
            },
            "413": {
              description: "Request text exceeds 1,024 characters.",
              content: errorContent,
            },
            "503": {
              description: "Newsletter configuration or provider unavailable.",
              content: errorContent,
            },
          },
        },
      },
    },
  };
}
