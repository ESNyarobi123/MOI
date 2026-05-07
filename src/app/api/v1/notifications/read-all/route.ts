import type { NextRequest } from "next/server";
import { requireAuth } from "@/middleware/auth.middleware";
import { notificationService } from "@/services/notification.service";
import { withErrorHandler } from "@/utils/handlers";
import { ok } from "@/utils/response";

export async function POST(request: NextRequest) {
  return withErrorHandler(request, async () => {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    const requestId = request.headers.get("x-request-id") ?? undefined;
    await notificationService.markAllRead(auth.userId);
    return ok({ markedAll: true }, requestId);
  });
}
