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

    const validTypes = ["text", "image", "voice_note", "sticker"];
    if (!body?.chatId || !validTypes.includes(body?.type)) {
      return fail({ code: "BAD_REQUEST", message: ERROR_MESSAGES.BAD_REQUEST }, requestId);
    }

    const message = await chatService.sendMessage({
      chatId: body.chatId,
      senderUserId: auth.userId,
      body: body.body,
      type: body.type,
      mediaUrl: body.mediaUrl
    });

    return ok(message, requestId, 201);
  });
}
