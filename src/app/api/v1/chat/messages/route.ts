import type { NextRequest } from "next/server";
import { ERROR_MESSAGES } from "@/constants/errors";
import { requireAuth } from "@/middleware/auth.middleware";
import { chatService } from "@/services/chat.service";
import { withErrorHandler } from "@/utils/handlers";
import { fail, ok } from "@/utils/response";

export async function GET(request: NextRequest) {
  return withErrorHandler(request, async () => {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    const requestId = request.headers.get("x-request-id") ?? undefined;
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId");

    if (!chatId) {
      return fail({ code: "BAD_REQUEST", message: ERROR_MESSAGES.BAD_REQUEST }, requestId);
    }

    const limitRaw = searchParams.get("limit");
    const beforeMessageId = searchParams.get("before");
    const parsedLimit = limitRaw ? Number.parseInt(limitRaw, 10) : Number.NaN;
    const limit = Number.isFinite(parsedLimit) ? parsedLimit : 200;

    const thread = await chatService.getThreadForMobile(chatId, auth.userId, {
      limit,
      beforeMessageId: beforeMessageId?.trim() ? beforeMessageId.trim() : null
    });
    return ok(thread, requestId);
  });
}
