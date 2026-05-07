import type { NextRequest } from "next/server";
import { ERROR_MESSAGES } from "@/constants/errors";
import { authService } from "@/services/auth.service";
import { withErrorHandler } from "@/utils/handlers";
import { fail, ok } from "@/utils/response";

export async function POST(request: NextRequest) {
  return withErrorHandler(request, async () => {
    const requestId = request.headers.get("x-request-id") ?? undefined;
    const body = await request.json();

    // Debug logging for admin login issues
    if (body?.email === "admin@moidate.com") {
      console.log("[LOGIN DEBUG] Admin login attempt:", {
        email: body.email,
        passwordLength: body.password?.length,
        passwordReceived: body.password ? `"${body.password}"` : "undefined"
      });
    }

    if (!body?.email || !body?.password) {
      return fail(
        { code: "BAD_REQUEST", message: ERROR_MESSAGES.BAD_REQUEST },
        requestId
      );
    }

    const result = await authService.login({
      email: body.email,
      password: body.password
    });
    return ok(result, requestId);
  });
}
