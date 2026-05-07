import type { NextRequest } from "next/server";
import { requireAuth } from "@/middleware/auth.middleware";
import { realtimeGateway } from "@/lib/socket/server";
import { withErrorHandler } from "@/utils/handlers";
import { ok } from "@/utils/response";

export async function GET(request: NextRequest) {
  return withErrorHandler(request, async () => {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    const requestId = request.headers.get("x-request-id") ?? undefined;
    const { searchParams } = new URL(request.url);

    const userId = searchParams.get("userId") ?? auth.userId;
    const chatId = searchParams.get("chatId");

    return ok(
      {
        presence: realtimeGateway.getPresence(userId),
        typing: chatId ? realtimeGateway.getTyping(chatId) : []
      },
      requestId
    );
  });
}
