import Terminal from "../components/Terminal";
import { FaqData } from "../components/StructuredData";
import { learnFaqs } from "../lib/content";
import { pageMetadata } from "../lib/seo";
export const metadata = pageMetadata("/learn");
export default function Page() {
  return (
    <>
      <FaqData path="/learn" faqs={learnFaqs} />
      <Terminal view="learn" />
    </>
  );
}
