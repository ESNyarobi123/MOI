import type { NextRequest } from "next/server";
import { ERROR_MESSAGES } from "@/constants/errors";
import { authService } from "@/services/auth.service";
import { withErrorHandler } from "@/utils/handlers";
import { fail, ok } from "@/utils/response";

export async function POST(request: NextRequest) {
  return withErrorHandler(request, async () => {
    const requestId = request.headers.get("x-request-id") ?? undefined;
    const body = await request.json();

    if (!body?.email || !body?.code) {
      return fail(
        { code: "BAD_REQUEST", message: ERROR_MESSAGES.BAD_REQUEST },
        requestId
      );
    }

    const result = await authService.verifyRegistrationOtp(body.email, String(body.code));
    return ok(result, requestId);
  });
}
