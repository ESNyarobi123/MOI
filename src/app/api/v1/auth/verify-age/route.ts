import type { NextRequest } from "next/server";
import { ERROR_MESSAGES } from "@/constants/errors";
import { requireAuth } from "@/middleware/auth.middleware";
import { authService } from "@/services/auth.service";
import { withErrorHandler } from "@/utils/handlers";
import { fail, ok } from "@/utils/response";

export async function POST(request: NextRequest) {
  return withErrorHandler(request, async () => {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;

    const requestId = request.headers.get("x-request-id") ?? undefined;
    const body = await request.json();

    if (typeof body?.age !== "number") {
      return fail(
        { code: "BAD_REQUEST", message: ERROR_MESSAGES.BAD_REQUEST },
        requestId
      );
    }

    const dob =
      typeof body?.dateOfBirth === "string" && body.dateOfBirth.length > 0
        ? body.dateOfBirth
        : undefined;
    const result = await authService.verifyAge(auth.userId, body.age, dob);
    return ok(result, requestId);
  });
}
