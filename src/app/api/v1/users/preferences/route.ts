import type { NextRequest } from "next/server";
import { ERROR_MESSAGES } from "@/constants/errors";
import { requireAuth } from "@/middleware/auth.middleware";
import { userService } from "@/services/user.service";
import { withErrorHandler } from "@/utils/handlers";
import { fail, ok } from "@/utils/response";

export async function PUT(request: NextRequest) {
  return withErrorHandler(request, async () => {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    const requestId = request.headers.get("x-request-id") ?? undefined;
    const body = await request.json();

    if (!Array.isArray(body?.interests) || !Array.isArray(body?.lookingFor)) {
      return fail({ code: "BAD_REQUEST", message: ERROR_MESSAGES.BAD_REQUEST }, requestId);
    }

    await userService.updateInterests(auth.userId, body.interests);
    await userService.updateMe(auth.userId, { lookingFor: body.lookingFor });
    const updated = await userService.getMe(auth.userId);
    return ok(updated, requestId);
  });
}
