import { openApiSpec } from "@/lib/docs/openapi";

export async function GET() {
  return Response.json(openApiSpec);
}
