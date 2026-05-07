import type { NextRequest } from "next/server";
import { ERROR_MESSAGES } from "@/constants/errors";
import { requireAdmin } from "@/middleware/role.middleware";
import { adminService } from "@/services/admin.service";
import { withErrorHandler } from "@/utils/handlers";
import { fail, ok } from "@/utils/response";

export async function POST(request: NextRequest) {
  return withErrorHandler(request, async () => {
    const admin = await requireAdmin(request);
    if (admin instanceof Response) return admin;

    const requestId = request.headers.get("x-request-id") ?? undefined;
    const body = await request.json();

    if (!body?.userId || typeof body?.ban !== "boolean") {
      return fail({ code: "BAD_REQUEST", message: ERROR_MESSAGES.BAD_REQUEST }, requestId);
    }

    const user = await adminService.banUser(body.userId, body.ban, body?.reason);
    return ok(user, requestId);
  });
}
