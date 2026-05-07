import type { NextRequest } from "next/server";
import { requireAuth } from "@/middleware/auth.middleware";
import { notificationService } from "@/services/notification.service";
import { AppError } from "@/utils/app-error";
import { withErrorHandler } from "@/utils/handlers";
import { ok } from "@/utils/response";

export async function POST(
  request: NextRequest,
  context: { params: { notificationId: string } }
) {
  return withErrorHandler(request, async () => {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    const requestId = request.headers.get("x-request-id") ?? undefined;
    const { notificationId } = context.params;
    const result = await notificationService.markRead(
      auth.userId,
      notificationId
    );
    if (result.count === 0) {
      throw new AppError("NOT_FOUND", "Notification not found.", 404);
    }
    return ok({ marked: true }, requestId);
  });
}
