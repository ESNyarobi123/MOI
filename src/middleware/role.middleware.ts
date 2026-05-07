import type { NextRequest } from "next/server";
import { ERROR_MESSAGES } from "@/constants/errors";
import { prisma } from "@/lib/db/prisma";
import { requireAuth, type AuthContext } from "@/middleware/auth.middleware";
import { fail } from "@/utils/response";

/** Valid Bearer JWT and `User.role === "ADMIN"`. Promote operators: `UPDATE "User" SET role = 'ADMIN' WHERE id = '…'`. */
export async function requireAdmin(
  request: NextRequest
): Promise<AuthContext | Response> {
  const requestId = request.headers.get("x-request-id") ?? undefined;
  const auth = requireAuth(request);
  if (auth instanceof Response) return auth;

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { role: true }
  });

  if (user?.role !== "ADMIN") {
    return fail({ code: "FORBIDDEN", message: ERROR_MESSAGES.FORBIDDEN }, requestId);
  }

  return auth;
}
