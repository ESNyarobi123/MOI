import type { NextRequest } from "next/server";
import { ReportStatus } from "@prisma/client";
import { ERROR_MESSAGES } from "@/constants/errors";
import { requireAdmin } from "@/middleware/role.middleware";
import { adminService } from "@/services/admin.service";
import { withErrorHandler } from "@/utils/handlers";
import { fail, ok } from "@/utils/response";

const ALLOWED = new Set<string>(Object.values(ReportStatus));

type Ctx = { params: { reportId: string } };

export async function PATCH(request: NextRequest, context: Ctx) {
  return withErrorHandler(request, async () => {
    const admin = await requireAdmin(request);
    if (admin instanceof Response) return admin;

    const requestId = request.headers.get("x-request-id") ?? undefined;
    const body = await request.json();
    const status = body?.status as string | undefined;
    if (!status || !ALLOWED.has(status)) {
      return fail({ code: "BAD_REQUEST", message: ERROR_MESSAGES.BAD_REQUEST }, requestId);
    }

    const updated = await adminService.updateReportStatus(
      context.params.reportId,
      status as ReportStatus,
      admin.userId
    );
    return ok(updated, requestId);
  });
}
