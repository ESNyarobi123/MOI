import type { NextRequest } from "next/server";
import { withErrorHandler } from "@/utils/handlers";
import { fail } from "@/utils/response";

export async function POST(request: NextRequest) {
  return withErrorHandler(request, async () => {
    const requestId = request.headers.get("x-request-id") ?? undefined;
    return fail(
      {
        code: "UNPROCESSABLE_ENTITY",
        message:
          "Payments webhook is deferred. Route is stored for future server-side integration.",
        status: 501
      },
      requestId
    );
  });
}
