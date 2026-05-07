import type { NextRequest } from "next/server";
import { ERROR_MESSAGES } from "@/constants/errors";
import { authService } from "@/services/auth.service";
import { withErrorHandler } from "@/utils/handlers";
import { fail, ok } from "@/utils/response";

export async function POST(request: NextRequest) {
  return withErrorHandler(request, async () => {
    const requestId = request.headers.get("x-request-id") ?? undefined;
    const body = await request.json();

    if (
      !body?.email ||
      !body?.password ||
      !body?.fullName ||
      typeof body?.age !== "number" ||
      !body?.gender
    ) {
      return fail(
        { code: "BAD_REQUEST", message: ERROR_MESSAGES.BAD_REQUEST },
        requestId
      );
    }

    if (body.age < 18) {
      return fail(
        {
          code: "FORBIDDEN",
          message: "MoiDate supports only users aged 18+."
        },
        requestId
      );
    }

    const result = await authService.register(body);
    return ok(result, requestId, 201);
  });
}
