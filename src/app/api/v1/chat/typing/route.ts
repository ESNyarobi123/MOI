import type { NextRequest } from "next/server";
import { ERROR_MESSAGES } from "@/constants/errors";
import { requireAuth } from "@/middleware/auth.middleware";
import { getSocketIo } from "@/lib/socket/io-singleton";
import { realtimeGateway } from "@/lib/socket/server";
import { withErrorHandler } from "@/utils/handlers";
import { fail, ok } from "@/utils/response";

export async function POST(request: NextRequest) {
  return withErrorHandler(request, async () => {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    const requestId = request.headers.get("x-request-id") ?? undefined;
    const body = await request.json();
    if (!body?.chatId) {
      return fail({ code: "BAD_REQUEST", message: ERROR_MESSAGES.BAD_REQUEST }, requestId);
    }

    const typing = realtimeGateway.emitTyping(
      body.chatId,
      auth.userId,
      Boolean(body?.typing)
    );

    getSocketIo()?.to(`chat:${body.chatId}`).emit("typing", typing);

    return ok(typing, requestId);
  });
}
