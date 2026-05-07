import type { NextRequest } from "next/server";
import { subscriptionUserService } from "@/services/subscription-user.service";
import { withErrorHandler } from "@/utils/handlers";
import { ok } from "@/utils/response";

/** Public: pricing / plan catalog (no auth). */
export async function GET(request: NextRequest) {
  return withErrorHandler(request, async () => {
    const requestId = request.headers.get("x-request-id") ?? undefined;
    const plans = await subscriptionUserService.listPlansPublic();
    return ok({ plans }, requestId);
  });
}
