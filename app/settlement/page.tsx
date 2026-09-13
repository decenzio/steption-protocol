import Terminal from "../components/Terminal";
import { pageMetadata } from "../lib/seo";
export const metadata = pageMetadata("/settlement");
export default function Page() {
  return <Terminal view="settlement" />;
}
