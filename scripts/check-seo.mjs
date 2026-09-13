import assert from "node:assert/strict";

// Read-only acceptance check against a running dev or production server.
const base = new URL(process.argv[2] || "http://127.0.0.1:3001");
const indexable = process.argv.includes("--indexable");
const canonical = (
  process.env.SITE_URL || "https://steptionprotocol.com"
).replace(/\/$/, "");
const get = async (path, headers = {}, method = "GET") => {
  const response = await fetch(new URL(path, base), {
    headers,
    method,
    signal: AbortSignal.timeout(30000),
  });
  assert.equal(response.status, 200, `${method} ${path}`);
  return response;
};

const home = await get("/");
const html = await home.text();
assert.match(home.headers.get("content-type"), /text\/html/);
assert.match(
  home.headers.get("link"),
  /<\/\.well-known\/api-catalog>; rel="api-catalog"/,
);
const variesOnAccept = (response) =>
  assert.ok(
    response.headers
      .get("vary")
      ?.split(",")
      .some((field) => field.trim().toLowerCase() === "accept"),
    "Vary must include Accept, not just Accept-Encoding",
  );
variesOnAccept(home);
const homepageCanonical = html.match(
  /<link rel="canonical" href="([^"]+)"/,
)?.[1];
assert.equal(
  new URL(homepageCanonical).href,
  `${canonical}/`,
  "Homepage canonical",
);
assert.match(html, /<title>Steption \| XLM Options on Stellar<\/title>/);
assert.match(html, /property="og:image"/);
assert.match(html, /name="twitter:card" content="summary_large_image"/);
assert.match(html, /<html lang="en"/);
assert.equal(
  /name="robots" content="[^"]*noindex/.test(html),
  !indexable,
  "Homepage index policy",
);
const schemas = [
  ...html.matchAll(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
  ),
].map((m) => JSON.parse(m[1]));
assert.ok(
  schemas.some((s) =>
    s["@graph"]?.some((entry) => entry["@type"] === "Organization"),
  ),
  "Organization JSON-LD",
);
const faq = schemas.find((s) => s["@type"] === "FAQPage");
assert.ok(faq?.mainEntity.length >= 6, "Homepage FAQs");
const images = [...html.matchAll(/<img\b[^>]*>/g)];
assert.ok(images.length >= 3, "Team images rendered");
for (const [tag] of images)
  assert.match(tag, /\balt="[^"]+"/, "Descriptive image alt");

for (const path of [
  "/",
  "/learn",
  "/docs/api",
  "/app",
  "/markets",
  "/portfolio",
  "/liquidity",
  "/settlement",
]) {
  const md = await get(path, { Accept: "text/markdown" });
  assert.match(md.headers.get("content-type"), /text\/markdown/);
  variesOnAccept(md);
  assert.ok(Number(md.headers.get("x-markdown-tokens")) > 0);
  assert.match(await md.text(), /^# /);
  const browser = await get(path, { Accept: "text/html" });
  const body = await browser.text();
  assert.match(
    browser.headers.get("content-type"),
    /text\/html/,
    "HTML after Markdown must not be a cached Markdown variant",
  );
  variesOnAccept(browser);
  const shouldIndex = indexable && ["/", "/learn", "/docs/api"].includes(path);
  assert.equal(
    /name="robots" content="[^"]*noindex/.test(body),
    !shouldIndex,
    `${path} robots metadata`,
  );
  if (!shouldIndex)
    assert.match(browser.headers.get("x-robots-tag"), /noindex/);
}
for (const Accept of [
  "*/*",
  "text/markdown;q=0",
  "text/html;q=1,text/markdown;q=0.1",
]) {
  assert.match(
    (await get("/", { Accept })).headers.get("content-type"),
    /text\/html/,
  );
}
const head = await get("/", { Accept: "text/markdown" }, "HEAD");
assert.match(head.headers.get("content-type"), /text\/markdown/);
assert.equal(await head.text(), "");

const sitemap = await (await get("/sitemap.xml")).text();
assert.match(sitemap, /<urlset/);
const sitemapUrls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(
  (m) => m[1],
);
assert.deepEqual(
  sitemapUrls,
  indexable
    ? [`${canonical}/`, `${canonical}/learn`, `${canonical}/docs/api`]
    : [],
);
const robots = await (await get("/robots.txt")).text();
assert.match(robots, /Content-Signal: ai-train=no, search=yes, ai-input=yes/);
assert.equal(/^Disallow: \/$/m.test(robots), !indexable);
if (indexable) assert.ok(robots.includes(`Sitemap: ${canonical}/sitemap.xml`));

const llms = await (await get("/llms.txt")).text();
assert.match(llms, /^# Steption/);
for (const path of ["/index.md", "/learn.md", "/docs/api.md"]) {
  assert.ok(llms.includes(path));
  const response = await get(path);
  assert.match(response.headers.get("content-type"), /text\/markdown/);
  assert.match(response.headers.get("x-robots-tag"), /noindex/);
}
const catalogResponse = await get("/.well-known/api-catalog");
assert.match(
  catalogResponse.headers.get("content-type"),
  /application\/linkset\+json/,
);
const catalog = await catalogResponse.json();
assert.equal(
  catalog.linkset[0].anchor,
  `${canonical}/api/newsletter/subscribe`,
);
for (const relation of ["service-doc", "service-desc"]) {
  for (const entry of catalog.linkset[0][relation])
    await get(new URL(entry.href).pathname);
}
const openapi = await (await get("/openapi.json")).json();
assert.equal(openapi.openapi, "3.1.0");
assert.deepEqual(Object.keys(openapi.paths), ["/api/newsletter/subscribe"]);

const og = await get("/opengraph-image");
assert.match(og.headers.get("content-type"), /image\/png/);
const png = Buffer.from(await og.arrayBuffer());
assert.equal(png.subarray(1, 4).toString(), "PNG");
assert.equal(png.readUInt32BE(16), 1200);
assert.equal(png.readUInt32BE(20), 630);
console.log(
  `SEO/GEO checks passed (${indexable ? "indexable production" : "noindex preview"}): HTML/Markdown negotiation, cache variants, metadata, schema, alt tags, sitemap, robots, agent discovery, OpenAPI and 1200×630 OG image.`,
);
