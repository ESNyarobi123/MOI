import type { NextRequest } from "next/server";
import { ERROR_MESSAGES } from "@/constants/errors";
import { requireAuth } from "@/middleware/auth.middleware";
import { safetyService } from "@/services/safety.service";
import { withErrorHandler } from "@/utils/handlers";
import { fail, ok } from "@/utils/response";

export async function GET(request: NextRequest) {
  return withErrorHandler(request, async () => {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    const requestId = request.headers.get("x-request-id") ?? undefined;
    const items = await safetyService.listEmergencyPlans(auth.userId);
    return ok({ items }, requestId);
  });
}

export async function POST(request: NextRequest) {
  return withErrorHandler(request, async () => {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    const requestId = request.headers.get("x-request-id") ?? undefined;
    const body = await request.json();

    if (!body?.contactPhone || !body?.dateLocation || !body?.startTime) {
      return fail({ code: "BAD_REQUEST", message: ERROR_MESSAGES.BAD_REQUEST }, requestId);
    }

    const plan = await safetyService.createEmergencyPlan({
      userId: auth.userId,
      contactPhone: body.contactPhone,
      dateLocation: body.dateLocation,
      startTime: body.startTime,
      endTime: body.endTime,
      isShared: body.isShared
    });
    return ok(plan, requestId, 201);
  });
}
