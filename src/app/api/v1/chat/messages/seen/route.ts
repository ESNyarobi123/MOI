import type { NextRequest } from "next/server";
import { ERROR_MESSAGES } from "@/constants/errors";
import { requireAuth } from "@/middleware/auth.middleware";
import { realtimeGateway } from "@/lib/socket/server";
import { chatService } from "@/services/chat.service";
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

    const result = await chatService.markSeen(body.chatId, auth.userId);
    const receipt = realtimeGateway.emitReadReceipt(
      body.chatId,
      auth.userId,
      result.count ?? 0
    );
    return ok({ ...result, receipt }, requestId);
  });
}
