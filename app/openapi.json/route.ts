import { openApiDocument } from "../lib/api-docs";
export const dynamic = "force-static";
export function GET() {
  return Response.json(openApiDocument(), {
    headers: {
      "Content-Type": "application/vnd.oai.openapi+json; charset=utf-8",
    },
  });
}
