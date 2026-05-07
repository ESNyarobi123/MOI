import type { NextRequest } from "next/server";
import { requireAuth } from "@/middleware/auth.middleware";
import { notificationService } from "@/services/notification.service";
import { withErrorHandler } from "@/utils/handlers";
import { ok } from "@/utils/response";

export async function GET(request: NextRequest) {
  return withErrorHandler(request, async () => {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    const requestId = request.headers.get("x-request-id") ?? undefined;
    const limitRaw = request.nextUrl.searchParams.get("limit");
    const limit = limitRaw
      ? Math.min(100, Math.max(1, parseInt(limitRaw, 10) || 50))
      : 50;
    const items = await notificationService.listForUser(auth.userId, limit);
    return ok({ items }, requestId);
  });
}
