import type { NextRequest } from "next/server";
import { ERROR_MESSAGES } from "@/constants/errors";
import { requireAuth } from "@/middleware/auth.middleware";
import { matchingService } from "@/services/matching.service";
import { withErrorHandler } from "@/utils/handlers";
import { fail, ok } from "@/utils/response";

export async function POST(request: NextRequest) {
  return withErrorHandler(request, async () => {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;

    const requestId = request.headers.get("x-request-id") ?? undefined;
    const body = await request.json();

    const validActions = ["like", "pass", "superlike"];
    if (!body?.targetUserId || !validActions.includes(body?.action)) {
      return fail(
        { code: "BAD_REQUEST", message: ERROR_MESSAGES.BAD_REQUEST },
        requestId
      );
    }

    const swipeResult = await matchingService.swipe({
      actorUserId: auth.userId,
      targetUserId: body.targetUserId,
      action: body.action
    });

    return ok(swipeResult, requestId);
  });
}
