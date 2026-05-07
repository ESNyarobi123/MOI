import type { NextRequest } from "next/server";
import { ERROR_MESSAGES } from "@/constants/errors";
import { requireAuth } from "@/middleware/auth.middleware";
import { realtimeGateway } from "@/lib/socket/server";
import { userService } from "@/services/user.service";
import { withErrorHandler } from "@/utils/handlers";
import { fail, ok } from "@/utils/response";

export async function POST(request: NextRequest) {
  return withErrorHandler(request, async () => {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;

    const requestId = request.headers.get("x-request-id") ?? undefined;
    const body = await request.json();
    if (typeof body?.online !== "boolean") {
      return fail({ code: "BAD_REQUEST", message: ERROR_MESSAGES.BAD_REQUEST }, requestId);
    }

    const updated = await userService.setOnlineStatus(auth.userId, body.online);
    const presence = realtimeGateway.emitPresence(
      auth.userId,
      body.online ? "online" : "offline"
    );
    return ok({ ...updated, online: body.online, presence }, requestId);
  });
}
