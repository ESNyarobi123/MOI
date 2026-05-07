import type { NextRequest } from "next/server";
import { authService } from "@/services/auth.service";
import { withErrorHandler } from "@/utils/handlers";
import { fail, ok } from "@/utils/response";

export async function POST(request: NextRequest) {
  return withErrorHandler(request, async () => {
    const requestId = request.headers.get("x-request-id") ?? undefined;
    const body = await request.json().catch(() => ({}));
    const { idToken } = body as { idToken?: string };

    if (!idToken?.trim()) {
      return fail({ code: "BAD_REQUEST", message: "idToken is required." }, requestId);
    }

    const result = await authService.loginWithGoogleIdToken(idToken.trim());
    return ok({ provider: "google", ...result }, requestId);
  });
}
