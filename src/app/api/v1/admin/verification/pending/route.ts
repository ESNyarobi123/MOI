import type { NextRequest } from "next/server";
import { requireAdmin } from "@/middleware/role.middleware";
import { verificationService } from "@/services/verification.service";
import { withErrorHandler } from "@/utils/handlers";
import { ok } from "@/utils/response";

export async function GET(request: NextRequest) {
  return withErrorHandler(request, async () => {
    const admin = await requireAdmin(request);
    if (admin instanceof Response) return admin;

    const requestId = request.headers.get("x-request-id") ?? undefined;
    const items = await verificationService.listPendingForAdmin();
    return ok({ items }, requestId);
  });
}
