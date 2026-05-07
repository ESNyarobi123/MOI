import type { NextRequest } from "next/server";
import { requireAuth } from "@/middleware/auth.middleware";
import { matchingService } from "@/services/matching.service";
import { withErrorHandler } from "@/utils/handlers";
import { ok } from "@/utils/response";

const ALLOWED_RADIUS = new Set([5, 10, 50]);

export async function GET(request: NextRequest) {
  return withErrorHandler(request, async () => {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;

    const requestId = request.headers.get("x-request-id") ?? undefined;
    const { searchParams } = new URL(request.url);
    const countrywide = searchParams.get("countrywide") === "true";
    const radiusRaw = searchParams.get("radiusKm");
    let radiusKm: number | undefined;
    if (radiusRaw != null) {
      const n = Number(radiusRaw);
      if (!ALLOWED_RADIUS.has(n)) {
        radiusKm = undefined;
      } else {
        radiusKm = n;
      }
    }

    const feed = await matchingService.getFeed(auth.userId, {
      countrywide,
      radiusKm
    });
    return ok({ items: feed, filters: { countrywide, radiusKm } }, requestId);
  });
}
