import type { NextRequest } from "next/server";
import { ERROR_MESSAGES } from "@/constants/errors";
import { requireAuth } from "@/middleware/auth.middleware";
import { stickerService } from "@/services/sticker.service";
import { withErrorHandler } from "@/utils/handlers";
import { fail, ok } from "@/utils/response";

export async function GET(
  request: NextRequest,
  context: { params: { slug: string } }
) {
  return withErrorHandler(request, async () => {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    const requestId = request.headers.get("x-request-id") ?? undefined;
    const { slug } = context.params;

    const pack = await stickerService.getPackBySlug(slug);
    if (!pack) {
      return fail({ code: "NOT_FOUND", message: ERROR_MESSAGES.NOT_FOUND }, requestId);
    }

    return ok(pack, requestId);
  });
}
