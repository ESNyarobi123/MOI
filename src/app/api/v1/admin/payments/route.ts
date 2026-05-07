import type { NextRequest } from "next/server";
import { requireAdmin } from "@/middleware/role.middleware";
import { adminService } from "@/services/admin.service";
import { withErrorHandler } from "@/utils/handlers";
import { ok } from "@/utils/response";

/** Recorded subscription/payment state in DB; Stripe webhook is still a placeholder. */
export async function GET(request: NextRequest) {
  return withErrorHandler(request, async () => {
    const admin = await requireAdmin(request);
    if (admin instanceof Response) return admin;

    const requestId = request.headers.get("x-request-id") ?? undefined;
    const summary = await adminService.getPaymentsSummary();
    return ok(summary, requestId);
  });
}
