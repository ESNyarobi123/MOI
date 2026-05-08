import type { NextRequest } from "next/server";
import { requireAuth } from "@/middleware/auth.middleware";
import { statusService } from "@/services/status.service";
import { withErrorHandler } from "@/utils/handlers";
import { ok } from "@/utils/response";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ statusId: string }> }
) {
  return withErrorHandler(request, async () => {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    const requestId = request.headers.get("x-request-id") ?? undefined;

    const { statusId } = await params;
    const deleted = await statusService.remove(auth.userId, statusId);
    return ok({ deleted }, requestId);
  });
}
