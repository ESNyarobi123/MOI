import type { NextRequest } from "next/server";
import { ERROR_MESSAGES } from "@/constants/errors";
import { requireAuth } from "@/middleware/auth.middleware";
import { mediaService } from "@/services/media.service";
import { withErrorHandler } from "@/utils/handlers";
import { fail, ok } from "@/utils/response";

export async function GET(request: NextRequest) {
  return withErrorHandler(request, async () => {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    const requestId = request.headers.get("x-request-id") ?? undefined;
    const items = await mediaService.list(auth.userId);
    return ok({ items }, requestId);
  });
}

export async function POST(request: NextRequest) {
  return withErrorHandler(request, async () => {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    const requestId = request.headers.get("x-request-id") ?? undefined;
    const body = await request.json();

    const validTypes = ["photo", "video"];
    if (!body?.url || !validTypes.includes(body?.mediaType)) {
      return fail({ code: "BAD_REQUEST", message: ERROR_MESSAGES.BAD_REQUEST }, requestId);
    }

    const item = await mediaService.create({
      userId: auth.userId,
      url: body.url,
      mediaType: body.mediaType,
      isPrimary: body.isPrimary
    });
    return ok(item, requestId, 201);
  });
}
