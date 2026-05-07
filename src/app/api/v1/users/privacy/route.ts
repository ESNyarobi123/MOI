import type { NextRequest } from "next/server";
import { requireAuth } from "@/middleware/auth.middleware";
import { userService } from "@/services/user.service";
import { withErrorHandler } from "@/utils/handlers";
import { ok } from "@/utils/response";

export async function PUT(request: NextRequest) {
  return withErrorHandler(request, async () => {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    const requestId = request.headers.get("x-request-id") ?? undefined;
    const body = await request.json();

    const updated = await userService.updatePrivacy(auth.userId, body ?? {});
    return ok(updated, requestId);
  });
}
