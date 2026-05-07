import type { NextRequest } from "next/server";
import { withErrorHandler } from "@/utils/handlers";
import { ok } from "@/utils/response";
import { getAllLegalDocs } from "@/lib/legal/content";

function getBaseUrl(request: NextRequest) {
  const envBase = process.env.PUBLIC_APP_URL?.trim();
  if (envBase) return envBase.replace(/\/+$/, "");
  const origin = request.nextUrl.origin;
  return origin.replace(/\/+$/, "");
}

export async function GET(request: NextRequest) {
  return withErrorHandler(request, async () => {
    const requestId = request.headers.get("x-request-id") ?? undefined;
    const base = getBaseUrl(request);
    const docs = getAllLegalDocs().map((doc) => ({
      ...doc,
      webUrl: `${base}/legal/${doc.key}`,
      apiUrl: `${base}/api/v1/legal/${doc.key}`
    }));
    return ok({ docs }, requestId);
  });
}

