import Website from "./components/Website";
import { FaqData, OrganizationData } from "./components/StructuredData";
import { homeFaqs } from "./lib/content";
import { pageMetadata } from "./lib/seo";
export const metadata = pageMetadata("/");
export default function Page() {
  return (
    <>
      <OrganizationData />
      <FaqData path="/" faqs={homeFaqs} />
      <Website />
    </>
  );
}
