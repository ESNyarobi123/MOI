import type { NextRequest } from "next/server";
import { requireAuth } from "@/middleware/auth.middleware";
import { subscriptionUserService } from "@/services/subscription-user.service";
import { withErrorHandler } from "@/utils/handlers";
import { ok } from "@/utils/response";

export async function GET(request: NextRequest) {
  return withErrorHandler(request, async () => {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    const requestId = request.headers.get("x-request-id") ?? undefined;
    const subscription = await subscriptionUserService.getMyActiveSubscription(
      auth.userId
    );
    return ok({ subscription }, requestId);
  });
}
