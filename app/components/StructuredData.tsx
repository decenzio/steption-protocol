import { absoluteUrl } from "../lib/seo";

export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

export function OrganizationData() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            "@id": absoluteUrl("/#organization"),
            name: "Decenzio",
            url: "https://decenzio.com",
            description:
              "The team building Steption, an options protocol on Stellar.",
            logo: absoluteUrl("/DCNZ_Primary-Logo_Black.svg"),
            email: "hello@decenzio.com",
            sameAs: [
              "https://x.com/DecenzioHQ",
              "https://github.com/decenzio",
              "https://www.linkedin.com/company/decenzio/",
            ],
            brand: {
              "@type": "Brand",
              name: "Steption",
              url: absoluteUrl("/"),
            },
          },
          {
            "@type": "WebSite",
            "@id": absoluteUrl("/#website"),
            name: "Steption",
            url: absoluteUrl("/"),
            inLanguage: "en",
            publisher: { "@id": absoluteUrl("/#organization") },
          },
        ],
      }}
    />
  );
}

export function FaqData({
  path,
  faqs,
}: {
  path: string;
  faqs: readonly (readonly string[])[];
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "@id": absoluteUrl(`${path}#faq`),
        url: absoluteUrl(path),
        mainEntity: faqs.map(([question, answer]) => ({
          "@type": "Question",
          name: question,
          acceptedAnswer: { "@type": "Answer", text: answer },
        })),
      }}
    />
  );
}
