import type { NextRequest } from "next/server";
import { ERROR_MESSAGES } from "@/constants/errors";
import { requireAuth } from "@/middleware/auth.middleware";
import { chatService } from "@/services/chat.service";
import { withErrorHandler } from "@/utils/handlers";
import { fail, ok } from "@/utils/response";

export async function PATCH(
  request: NextRequest,
  context: { params: { chatId: string } }
) {
  return withErrorHandler(request, async () => {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    const requestId = request.headers.get("x-request-id") ?? undefined;
    const { chatId } = context.params;
    const body = await request.json().catch(() => ({}));

    const patch: { isMuted?: boolean; isArchived?: boolean } = {};
    if (typeof body?.isMuted === "boolean") patch.isMuted = body.isMuted;
    if (typeof body?.isArchived === "boolean") patch.isArchived = body.isArchived;

    if (Object.keys(patch).length === 0) {
      return fail({ code: "BAD_REQUEST", message: ERROR_MESSAGES.BAD_REQUEST }, requestId);
    }

    const updated = await chatService.updateParticipantSettings(chatId, auth.userId, patch);
    return ok(updated, requestId);
  });
}
