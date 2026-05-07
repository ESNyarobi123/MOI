import type { NextRequest } from "next/server";
import { withErrorHandler } from "@/utils/handlers";
import { ok, fail } from "@/utils/response";
import { getLegalDoc, type LegalDocKey } from "@/lib/legal/content";

const allowedDocs = new Set<LegalDocKey>(["terms", "privacy", "cookies"]);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ doc: string }> }
) {
  return withErrorHandler(request, async () => {
    const requestId = request.headers.get("x-request-id") ?? undefined;
    const { doc } = await params;
    if (!allowedDocs.has(doc as LegalDocKey)) {
      return fail(
        {
          code: "NOT_FOUND",
          message: "Legal document not found."
        },
        requestId
      );
    }
    return ok(getLegalDoc(doc as LegalDocKey), requestId);
  });
}

