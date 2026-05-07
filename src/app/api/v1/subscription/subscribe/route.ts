import type { NextRequest } from "next/server";
import { requireAuth } from "@/middleware/auth.middleware";
import { withErrorHandler } from "@/utils/handlers";
import { fail } from "@/utils/response";

/** Reserved until Stripe / in-app billing is wired. */
export async function POST(request: NextRequest) {
  return withErrorHandler(request, async () => {
    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;
    const requestId = request.headers.get("x-request-id") ?? undefined;
    return fail(
      {
        code: "UNPROCESSABLE_ENTITY",
        message:
          "Subscription checkout is not enabled yet. Use admin tools or wait for payment integration.",
        status: 501
      },
      requestId
    );
  });
}
