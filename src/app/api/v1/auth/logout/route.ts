import type { NextRequest } from "next/server";
import { ERROR_MESSAGES } from "@/constants/errors";
import { authService } from "@/services/auth.service";
import { withErrorHandler } from "@/utils/handlers";
import { fail, ok } from "@/utils/response";

export async function POST(request: NextRequest) {
  return withErrorHandler(request, async () => {
    const requestId = request.headers.get("x-request-id") ?? undefined;
    const body = await request.json();

    if (!body?.refreshToken) {
      return fail(
        { code: "BAD_REQUEST", message: ERROR_MESSAGES.BAD_REQUEST },
        requestId
      );
    }

    const result = await authService.logout(String(body.refreshToken));
    return ok(result, requestId);
  });
}
