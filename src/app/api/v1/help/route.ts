import type { NextRequest } from "next/server";
import { getHelpContent } from "@/lib/help/content";
import { withErrorHandler } from "@/utils/handlers";
import { ok } from "@/utils/response";

export async function GET(request: NextRequest) {
  return withErrorHandler(request, async () => {
    const requestId = request.headers.get("x-request-id") ?? undefined;
    return ok(getHelpContent(), requestId);
  });
}
