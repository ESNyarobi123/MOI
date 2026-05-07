import type { NextRequest } from "next/server";
import { withErrorHandler } from "@/utils/handlers";
import { ok } from "@/utils/response";
import { getAllLegalDocs } from "@/lib/legal/content";

function getAppUrl(request: NextRequest) {
  const envBase = process.env.APP_URL?.trim() || process.env.PUBLIC_APP_URL?.trim();
  if (envBase) return envBase.replace(/\/+$/, "");
  return request.nextUrl.origin.replace(/\/+$/, "");
}

function getApiBaseUrl(request: NextRequest) {
  const envBase =
    process.env.API_BASE_URL?.trim() ||
    process.env.PUBLIC_API_BASE_URL?.trim() ||
    process.env.PUBLIC_APP_URL?.trim();
  if (envBase) return envBase.replace(/\/+$/, "");
  return request.nextUrl.origin.replace(/\/+$/, "");
}

export async function GET(request: NextRequest) {
  return withErrorHandler(request, async () => {
    const requestId = request.headers.get("x-request-id") ?? undefined;
    const appBase = getAppUrl(request);
    const apiBase = getApiBaseUrl(request);
    const docs = getAllLegalDocs().map((doc) => ({
      ...doc,
      webUrl: `${appBase}/legal/${doc.key}`,
      apiUrl: `${apiBase}/api/v1/legal/${doc.key}`
    }));
    return ok({ docs }, requestId);
  });
}

