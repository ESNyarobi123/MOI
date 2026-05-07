import type { NextRequest } from "next/server";
import { requireAuth } from "@/middleware/auth.middleware";
import { aiService } from "@/services/ai.service";
import { withErrorHandler } from "@/utils/handlers";
import { ok } from "@/utils/response";

export async function POST(request: NextRequest) {
  return withErrorHandler(request, async () => {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    const requestId = request.headers.get("x-request-id") ?? undefined;
    const body = await request.json();

    const data = await aiService.generateIcebreakers({
      myName: body?.myName,
      targetName: body?.targetName,
      targetBio: body?.targetBio,
      interests: body?.interests
    });

    return ok(data, requestId);
  });
}
