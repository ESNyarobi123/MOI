import type { NextRequest } from "next/server";
import { requireAuth } from "@/middleware/auth.middleware";
import { safetyService } from "@/services/safety.service";
import { withErrorHandler } from "@/utils/handlers";
import { ok } from "@/utils/response";

export async function POST(
  request: NextRequest,
  context: { params: { planId: string } }
) {
  return withErrorHandler(request, async () => {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    const requestId = request.headers.get("x-request-id") ?? undefined;
    const { planId } = context.params;

    const result = await safetyService.shareEmergencyPlanBySms(planId, auth.userId);
    return ok(result, requestId);
  });
}
