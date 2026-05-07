import type { NextRequest } from "next/server";
import { authService } from "@/services/auth.service";
import { withErrorHandler } from "@/utils/handlers";
import { fail, ok } from "@/utils/response";

export async function GET(request: NextRequest) {
  return withErrorHandler(request, async () => {
    const requestId = request.headers.get("x-request-id") ?? undefined;
    const code = request.nextUrl.searchParams.get("code");
    if (!code) {
      return fail(
        {
          code: "BAD_REQUEST",
          message: "Missing OAuth code."
        },
        requestId
      );
    }

    const redirectUri = `${request.nextUrl.origin}/api/v1/auth/google/callback`;
    const result = await authService.loginWithGoogle({
      code,
      redirectUri
    });

    return ok(
      {
        provider: "google",
        ...result
      },
      requestId
    );
  });
}

