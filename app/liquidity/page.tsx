import Terminal from "../components/Terminal";
import { pageMetadata } from "../lib/seo";
export const metadata = pageMetadata("/liquidity");
export default function Page() {
  return <Terminal view="liquidity" />;
}
