import type { NextRequest } from "next/server";
import { ERROR_MESSAGES } from "@/constants/errors";
import { requireAdmin } from "@/middleware/role.middleware";
import { adminService } from "@/services/admin.service";
import { withErrorHandler } from "@/utils/handlers";
import { fail, ok } from "@/utils/response";

type Ctx = { params: { userId: string } };

export async function PATCH(request: NextRequest, context: Ctx) {
  return withErrorHandler(request, async () => {
    const admin = await requireAdmin(request);
    if (admin instanceof Response) return admin;

    const requestId = request.headers.get("x-request-id") ?? undefined;
    const body = await request.json();

    const patch: { accountRiskNote?: string | null; fakeAccountFlag?: boolean } = {};
    if (Object.prototype.hasOwnProperty.call(body, "accountRiskNote")) {
      if (body.accountRiskNote !== null && typeof body.accountRiskNote !== "string") {
        return fail({ code: "BAD_REQUEST", message: ERROR_MESSAGES.BAD_REQUEST }, requestId);
      }
      patch.accountRiskNote = body.accountRiskNote;
    }
    if (Object.prototype.hasOwnProperty.call(body, "fakeAccountFlag")) {
      if (typeof body.fakeAccountFlag !== "boolean") {
        return fail({ code: "BAD_REQUEST", message: ERROR_MESSAGES.BAD_REQUEST }, requestId);
      }
      patch.fakeAccountFlag = body.fakeAccountFlag;
    }

    if (
      !Object.prototype.hasOwnProperty.call(patch, "accountRiskNote") &&
      !Object.prototype.hasOwnProperty.call(patch, "fakeAccountFlag")
    ) {
      return fail({ code: "BAD_REQUEST", message: ERROR_MESSAGES.BAD_REQUEST }, requestId);
    }

    const updated = await adminService.setUserTrustFlags(context.params.userId, patch);
    return ok(updated, requestId);
  });
}
