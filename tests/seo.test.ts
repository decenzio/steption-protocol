import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { proxy } from "../proxy";
import { indexingAllowed } from "../app/lib/seo";
import { pageMarkdown, prefersMarkdown } from "../app/lib/markdown";
import { homeFaqs, learnFaqs } from "../app/lib/content";

test("Markdown negotiation respects explicit quality values and keeps browser defaults", () => {
  for (const accept of [
    null,
    "",
    "*/*",
    "text/*",
    "text/html",
    "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "text/markdown;q=0",
    "text/markdown;q=0, text/*;q=1",
    "text/markdown;q=0.3,text/html;q=0.9",
    "text/markdown;q=invalid",
    "text/markdown;q=1.1",
    "text/markdown;q=-1",
    "application/json",
  ])
    assert.equal(prefersMarkdown(accept), false, String(accept));
  for (const accept of [
    "text/markdown",
    "text/markdown; charset=utf-8",
    "TEXT/MARKDOWN",
    "text/markdown, text/html",
    "text/markdown;q=0.9,text/html;q=0.5",
    "text/markdown;q=0.1,text/html;q=0,*/*;q=1",
    "text/*;q=0,text/markdown;q=1",
    "text/html;q=0.2, text/markdown;q=0.7, text/markdown;q=0.3",
  ])
    assert.equal(prefersMarkdown(accept), true, accept);
});

test("only public production deployments can be indexed", () => {
  assert.equal(indexingAllowed({ NODE_ENV: "production" }), true);
  assert.equal(
    indexingAllowed({ NODE_ENV: "production", VERCEL_ENV: "production" }),
    true,
  );
  for (const env of [
    { NODE_ENV: "development" },
    { NODE_ENV: "test" },
    { NODE_ENV: "production", SEO_INDEXING: "false" },
    { NODE_ENV: "production", VERCEL_ENV: "preview", SEO_INDEXING: "true" },
    { NODE_ENV: "production", CONTEXT: "deploy-preview" },
    { NODE_ENV: "production", CONTEXT: "branch-deploy" },
  ])
    assert.equal(indexingAllowed(env as NodeJS.ProcessEnv), false);
});

test("Markdown retains the exact visible FAQs and protocol limitations", () => {
  for (const [path, faqs] of [
    ["/", homeFaqs],
    ["/learn", learnFaqs],
  ] as const) {
    const markdown = pageMarkdown(path);
    for (const [question, answer] of faqs) {
      assert.ok(markdown.includes(question));
      assert.ok(markdown.includes(answer));
    }
  }
  assert.match(
    pageMarkdown("/portfolio"),
    /does not contain live market quotes or account balances/,
  );
});

test("proxy separates HTML, Markdown, HEAD and RSC without handling writes", async () => {
  const makeRequest = (method: string, headers = {}, path = "/") =>
    new NextRequest(`https://steptionprotocol.com${path}`, { method, headers });
  const html = proxy(makeRequest("GET"));
  assert.equal(html.headers.get("x-middleware-next"), "1");
  assert.match(html.headers.get("vary")!, /Accept/);
  assert.match(html.headers.get("link")!, /rel="api-catalog"/);
  const markdown = proxy(makeRequest("GET", { accept: "text/markdown" }));
  assert.match(markdown.headers.get("content-type")!, /^text\/markdown/);
  assert.match(await markdown.text(), /^# Steption/);
  assert.ok(Number(markdown.headers.get("x-markdown-tokens")) > 0);
  const head = proxy(makeRequest("HEAD", { accept: "text/markdown" }));
  assert.equal(await head.text(), "");
  assert.match(head.headers.get("content-type")!, /^text\/markdown/);
  const rsc = proxy(makeRequest("GET", { accept: "text/markdown", rsc: "1" }));
  assert.equal(rsc.headers.get("x-middleware-next"), "1");
  const write = proxy(makeRequest("POST", { accept: "text/markdown" }));
  assert.equal(write.headers.get("x-middleware-next"), "1");
  const direct = proxy(makeRequest("GET", {}, "/learn.md"));
  assert.match(direct.headers.get("content-type")!, /^text\/markdown/);
  assert.match(direct.headers.get("x-robots-tag")!, /noindex/);
  const portfolio = proxy(makeRequest("GET", {}, "/portfolio"));
  assert.match(portfolio.headers.get("x-robots-tag")!, /noindex/);
});
