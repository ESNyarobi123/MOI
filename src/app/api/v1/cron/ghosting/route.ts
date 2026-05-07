import type { NextRequest } from "next/server";
import { withErrorHandler } from "@/utils/handlers";
import { fail, ok } from "@/utils/response";
import { runGhostingPenalties } from "@/services/ghosting.service";

/**
 * Schedule via hosting cron (e.g. daily) with header:
 *   x-cron-secret: <CRON_SECRET>
 * Requires CRON_SECRET in env.
 */
export async function POST(request: NextRequest) {
  return withErrorHandler(request, async () => {
    const requestId = request.headers.get("x-request-id") ?? undefined;
    const secret = process.env.CRON_SECRET;
    if (!secret) {
      return fail(
        {
          code: "SERVICE_UNAVAILABLE",
          message: "Cron is not configured (missing CRON_SECRET)."
        },
        requestId
      );
    }
    if (request.headers.get("x-cron-secret") !== secret) {
      return fail(
        { code: "UNAUTHORIZED", message: "Invalid or missing x-cron-secret." },
        requestId
      );
    }
    const result = await runGhostingPenalties();
    return ok(result, requestId);
  });
}
