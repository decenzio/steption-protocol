import Link from "next/link";
import { apiSections } from "../../lib/api-docs";
import { pageMetadata } from "../../lib/seo";
export const metadata = pageMetadata("/docs/api");

export default function Page() {
  return (
    <div className="website">
      <a className="skip-link" href="#api-docs">
        Skip to documentation
      </a>
      <header className="website-header">
        <Link href="/" className="brand">
          steption<span className="brand-period">.</span>
        </Link>
        <Link href="/app" className="button primary">
          Open app
        </Link>
      </header>
      <main id="api-docs" className="api-documentation">
        <span className="eyebrow">DEVELOPER RESOURCES</span>
        <h1>API & agent documentation</h1>
        <p className="api-intro">
          Public resources, content representations, and the boundaries of this
          Testnet release.
        </p>
        <nav aria-label="Documentation resources" className="api-links">
          <a href="/.well-known/api-catalog">API catalog ↗</a>
          <a href="/openapi.json">OpenAPI ↗</a>
          <a href="/docs/api.md">Markdown ↗</a>
          <a href="/llms.txt">llms.txt ↗</a>
        </nav>
        {apiSections.map(({ title, paragraphs }) => (
          <section key={title}>
            <h2>{title}</h2>
            {paragraphs.map((text) => (
              <p key={text}>{text}</p>
            ))}
          </section>
        ))}
        <section>
          <h2>Try a read-only request</h2>
          <pre>
            <code>
              {
                'curl -H "Accept: text/markdown" https://steptionprotocol.com/\ncurl https://steptionprotocol.com/.well-known/api-catalog'
              }
            </code>
          </pre>
        </section>
        <p>
          <Link href="/learn">Learn the protocol mechanics</Link> ·{" "}
          <a href="mailto:hello@decenzio.com">Contact Decenzio</a>
        </p>
      </main>
    </div>
  );
}
