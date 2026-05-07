import type { NextRequest } from "next/server";
import { ERROR_MESSAGES } from "@/constants/errors";
import { requireAuth } from "@/middleware/auth.middleware";
import { mediaService } from "@/services/media.service";
import { withErrorHandler } from "@/utils/handlers";
import { fail, ok } from "@/utils/response";

type Context = { params: { mediaId: string } };

export async function PATCH(request: NextRequest, context: Context) {
  return withErrorHandler(request, async () => {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    const requestId = request.headers.get("x-request-id") ?? undefined;
    const body = await request.json().catch(() => ({}));

    if (body?.isPrimary === true) {
      const updated = await mediaService.setPrimary(auth.userId, context.params.mediaId);
      return ok({ item: updated }, requestId);
    }

    return fail({ code: "BAD_REQUEST", message: ERROR_MESSAGES.BAD_REQUEST }, requestId);
  });
}

export async function DELETE(request: NextRequest, context: Context) {
  return withErrorHandler(request, async () => {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    const requestId = request.headers.get("x-request-id") ?? undefined;
    await mediaService.remove(auth.userId, context.params.mediaId);
    return ok({ deleted: true }, requestId);
  });
}
