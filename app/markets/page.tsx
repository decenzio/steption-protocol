import Terminal from "../components/Terminal";
import { pageMetadata } from "../lib/seo";
export const metadata = pageMetadata("/markets");
export default function Page() {
  return <Terminal view="markets" />;
}
