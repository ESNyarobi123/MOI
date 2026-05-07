import type { NextRequest } from "next/server";
import { requireAuth } from "@/middleware/auth.middleware";
import { userService } from "@/services/user.service";
import { withErrorHandler } from "@/utils/handlers";
import { ok } from "@/utils/response";

export async function GET(
  request: NextRequest,
  context: { params: { userId: string } }
) {
  return withErrorHandler(request, async () => {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    const requestId = request.headers.get("x-request-id") ?? undefined;
    const { userId: targetUserId } = context.params;

    const profile = await userService.getPublicProfile(auth.userId, targetUserId);
    return ok(profile, requestId);
  });
}
