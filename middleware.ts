import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { checkApiRateLimit } from "@/lib/security/rate-limit";
import { fail } from "@/utils/response";

function skipRateLimit(pathname: string) {
  return (
    pathname.startsWith("/api/v1/openapi") || pathname.startsWith("/api/v1/swagger")
  );
}

export async function middleware(request: NextRequest) {
  const headers = new Headers(request.headers);
  const requestId = headers.get("x-request-id") ?? crypto.randomUUID();
  if (!headers.get("x-request-id")) {
    headers.set("x-request-id", requestId);
  }

  const pathname = request.nextUrl.pathname;
  if (!skipRateLimit(pathname)) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";
    const { success } = await checkApiRateLimit(`api:${ip}`);
    if (!success) {
      return fail(
        { code: "TOO_MANY_REQUESTS", message: "Too many requests." },
        requestId
      );
    }
  }

  return NextResponse.next({
    request: {
      headers
    }
  });
}

export const config = {
  matcher: ["/api/:path*"]
};
