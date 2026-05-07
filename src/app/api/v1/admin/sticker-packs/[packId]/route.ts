import type { NextRequest } from "next/server";
import { ERROR_MESSAGES } from "@/constants/errors";
import { requireAdmin } from "@/middleware/role.middleware";
import { adminService } from "@/services/admin.service";
import { withErrorHandler } from "@/utils/handlers";
import { fail, ok } from "@/utils/response";

type Ctx = { params: { packId: string } };

export async function PATCH(request: NextRequest, context: Ctx) {
  return withErrorHandler(request, async () => {
    const admin = await requireAdmin(request);
    if (admin instanceof Response) return admin;

    const requestId = request.headers.get("x-request-id") ?? undefined;
    const body = await request.json().catch(() => ({}));

    const patch: { isActive?: boolean; name?: string } = {};
    if (typeof body?.isActive === "boolean") patch.isActive = body.isActive;
    if (typeof body?.name === "string") patch.name = body.name;

    if (Object.keys(patch).length === 0) {
      return fail({ code: "BAD_REQUEST", message: ERROR_MESSAGES.BAD_REQUEST }, requestId);
    }

    const updated = await adminService.updateStickerPack(context.params.packId, patch);
    return ok(updated, requestId);
  });
}
