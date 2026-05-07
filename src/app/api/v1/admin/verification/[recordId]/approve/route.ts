import type { NextRequest } from "next/server";
import { requireAdmin } from "@/middleware/role.middleware";
import { verificationService } from "@/services/verification.service";
import { withErrorHandler } from "@/utils/handlers";
import { ok } from "@/utils/response";

type Ctx = { params: { recordId: string } };

export async function POST(request: NextRequest, context: Ctx) {
  return withErrorHandler(request, async () => {
    const admin = await requireAdmin(request);
    if (admin instanceof Response) return admin;

    const requestId = request.headers.get("x-request-id") ?? undefined;
    const body = await request.json().catch(() => ({}));
    const updated = await verificationService.approve(
      context.params.recordId,
      admin.userId,
      body?.notes
    );
    return ok(updated, requestId);
  });
}
