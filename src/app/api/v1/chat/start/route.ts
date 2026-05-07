import type { NextRequest } from "next/server";
import { ERROR_MESSAGES } from "@/constants/errors";
import { requireAuth } from "@/middleware/auth.middleware";
import { chatService } from "@/services/chat.service";
import { withErrorHandler } from "@/utils/handlers";
import { fail, ok } from "@/utils/response";

export async function POST(request: NextRequest) {
  return withErrorHandler(request, async () => {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    const requestId = request.headers.get("x-request-id") ?? undefined;
    const body = await request.json();

    const otherUserId = body?.otherUserId ?? body?.targetUserId;
    if (!otherUserId || typeof otherUserId !== "string") {
      return fail({ code: "BAD_REQUEST", message: ERROR_MESSAGES.BAD_REQUEST }, requestId);
    }

    const chat = await chatService.startOrGetDirectChat(auth.userId, otherUserId);
    return ok(chat, requestId, 201);
  });
}
