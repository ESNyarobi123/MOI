import type { NextRequest } from "next/server";
import { requireAuth } from "@/middleware/auth.middleware";
import { matchingService } from "@/services/matching.service";
import { withErrorHandler } from "@/utils/handlers";
import { ok } from "@/utils/response";

export async function GET(request: NextRequest) {
  return withErrorHandler(request, async () => {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    const requestId = request.headers.get("x-request-id") ?? undefined;
    const items = await matchingService.listMatches(auth.userId);
    const matches = await matchingService.listMatchesForMobile(auth.userId);
    return ok({ items, matches }, requestId);
  });
}
