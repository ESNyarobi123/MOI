import type { NextRequest } from "next/server";
import { requireAdmin } from "@/middleware/role.middleware";
import { adminService } from "@/services/admin.service";
import { withErrorHandler } from "@/utils/handlers";
import { ok } from "@/utils/response";

export async function GET(request: NextRequest) {
  return withErrorHandler(request, async () => {
    const admin = await requireAdmin(request);
    if (admin instanceof Response) return admin;

    const requestId = request.headers.get("x-request-id") ?? undefined;
    const limitRaw = request.nextUrl.searchParams.get("limit");
    const limit = limitRaw
      ? Math.min(200, Math.max(1, parseInt(limitRaw, 10) || 50))
      : 50;

    const items = await adminService.listUsers(limit);
    return ok({ items }, requestId);
  });
}
