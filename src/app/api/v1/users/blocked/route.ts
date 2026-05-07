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
    const items = await userService.listBlockedUsers(auth.userId);
    return ok({ items }, requestId);
  });
}
