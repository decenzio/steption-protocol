import { apiCatalog } from "../../lib/api-docs";
import { discoveryLinks } from "../../lib/seo";
export const dynamic = "force-static";
export function GET() {
  return Response.json(apiCatalog(), {
    headers: {
      "Content-Type":
        'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"',
      Link: discoveryLinks(),
    },
  });
}
