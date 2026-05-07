import type { NextRequest } from "next/server";
import { authService } from "@/services/auth.service";
import { withErrorHandler } from "@/utils/handlers";
import { fail, ok } from "@/utils/response";

export async function POST(request: NextRequest) {
  return withErrorHandler(request, async () => {
    const requestId = request.headers.get("x-request-id") ?? undefined;
    const body = await request.json();

    const accessToken =
      typeof body?.accessToken === "string" ? body.accessToken : body?.token;
    const code = typeof body?.code === "string" ? body.code : undefined;
    const redirectUri =
      typeof body?.redirectUri === "string" ? body.redirectUri : undefined;

    if (!accessToken && !code) {
      return fail(
        {
          code: "BAD_REQUEST",
          message: "Provide accessToken or code for Google OAuth."
        },
        requestId
      );
    }

    const result = await authService.loginWithGoogle({
      accessToken,
      code,
      redirectUri
    });
    return ok(result, requestId);
  });
}

