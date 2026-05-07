import type { NextRequest } from "next/server";
import { requireAuth } from "@/middleware/auth.middleware";
import { userService } from "@/services/user.service";
import { withErrorHandler } from "@/utils/handlers";
import { ok } from "@/utils/response";

export async function GET(request: NextRequest) {
  return withErrorHandler(request, async () => {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;

    const requestId = request.headers.get("x-request-id") ?? undefined;
    const profile = await userService.getMe(auth.userId);
    return ok(profile, requestId);
  });
}

export async function PATCH(request: NextRequest) {
  return withErrorHandler(request, async () => {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;

    const requestId = request.headers.get("x-request-id") ?? undefined;
    const body = await request.json();
    const profile = await userService.updateMe(auth.userId, body ?? {});
    return ok(profile, requestId);
  });
}
