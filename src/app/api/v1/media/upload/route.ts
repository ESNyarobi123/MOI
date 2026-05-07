import type { NextRequest } from "next/server";
import { requireAuth } from "@/middleware/auth.middleware";
import { withErrorHandler } from "@/utils/handlers";
import { fail } from "@/utils/response";

export async function POST(request: NextRequest) {
  return withErrorHandler(request, async () => {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;

    const requestId = request.headers.get("x-request-id") ?? undefined;
    return fail(
      {
        code: "UNPROCESSABLE_ENTITY",
        message:
          "Media upload is deferred. Endpoint is reserved and will be activated during server implementation.",
        status: 501
      },
      requestId
    );
  });
}
