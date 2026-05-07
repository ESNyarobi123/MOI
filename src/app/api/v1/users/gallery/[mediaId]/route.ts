import type { NextRequest } from "next/server";
import { requireAuth } from "@/middleware/auth.middleware";
import { mediaService } from "@/services/media.service";
import { withErrorHandler } from "@/utils/handlers";
import { ok } from "@/utils/response";

type Context = { params: { mediaId: string } };

export async function DELETE(request: NextRequest, context: Context) {
  return withErrorHandler(request, async () => {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    const requestId = request.headers.get("x-request-id") ?? undefined;
    await mediaService.remove(auth.userId, context.params.mediaId);
    return ok({ deleted: true }, requestId);
  });
}
