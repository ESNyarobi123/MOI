import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/middleware/auth.middleware";
import { notificationService } from "@/services/notification.service";
import { statusService } from "@/services/status.service";
import { withErrorHandler } from "@/utils/handlers";
import { ok } from "@/utils/response";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ statusId: string }> }
) {
  return withErrorHandler(request, async () => {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    const requestId = request.headers.get("x-request-id") ?? undefined;

    const { statusId } = await params;
    const result = await statusService.toggleLike(statusId, auth.userId);
    const likeCount = await statusService.getLikeCount(statusId);

    if (result.liked) {
      const status = await prisma.userStatus.findUnique({
        where: { id: statusId },
        select: { userId: true },
      });
      if (status) {
        void notificationService.notifyStatusLike(status.userId, auth.userId, statusId);
      }
    }

    return ok({ ...result, likeCount }, requestId);
  });
}
