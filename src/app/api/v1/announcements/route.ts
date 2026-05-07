import type { NextRequest } from "next/server";
import { requireAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/db/prisma";
import { withErrorHandler } from "@/utils/handlers";
import { ok } from "@/utils/response";

/** In-app announcement feed (no admin PII). */
export async function GET(request: NextRequest) {
  return withErrorHandler(request, async () => {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    const requestId = request.headers.get("x-request-id") ?? undefined;
    const limitRaw = request.nextUrl.searchParams.get("limit");
    const limit = limitRaw
      ? Math.min(50, Math.max(1, parseInt(limitRaw, 10) || 20))
      : 20;
    const items = await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, title: true, body: true, createdAt: true }
    });
    return ok({ items }, requestId);
  });
}
