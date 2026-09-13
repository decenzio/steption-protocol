import { llmsText } from "../lib/markdown";
import { contentSignal, discoveryLinks } from "../lib/seo";
export const dynamic = "force-static";
export function GET() {
  return new Response(llmsText(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Signal": contentSignal,
      Link: discoveryLinks(),
    },
  });
}
