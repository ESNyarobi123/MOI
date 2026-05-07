import type { NextRequest } from "next/server";
import { requireAuth } from "@/middleware/auth.middleware";
import { chatService } from "@/services/chat.service";
import { withErrorHandler } from "@/utils/handlers";
import { ok } from "@/utils/response";

export async function GET(request: NextRequest) {
  return withErrorHandler(request, async () => {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    const requestId = request.headers.get("x-request-id") ?? undefined;

    const includeArchived =
      request.nextUrl.searchParams.get("includeArchived") === "true";
    const chats = await chatService.listMyChats(auth.userId, includeArchived);
    return ok({ items: chats }, requestId);
  });
}
