import Terminal from "../components/Terminal";
import { pageMetadata } from "../lib/seo";
export const metadata = pageMetadata("/portfolio");
export default function Page() {
  return <Terminal view="portfolio" />;
}
