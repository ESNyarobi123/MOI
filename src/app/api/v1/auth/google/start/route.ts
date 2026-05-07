import type { NextRequest } from "next/server";
import { buildGoogleAuthUrl, getGoogleOAuthConfig } from "@/lib/auth/oauth";
import { withErrorHandler } from "@/utils/handlers";
import { ok } from "@/utils/response";

export async function GET(request: NextRequest) {
  return withErrorHandler(request, async () => {
    const requestId = request.headers.get("x-request-id") ?? undefined;
    const state = crypto.randomUUID();
    const redirectUri = request.nextUrl.searchParams.get("redirectUri") || undefined;
    const authUrl = buildGoogleAuthUrl(state, redirectUri);
    const config = getGoogleOAuthConfig();

    return ok(
      {
        provider: "google",
        state,
        authUrl,
        redirectUri: redirectUri || config.callbackUrl,
        authorizedJavascriptOrigins: [config.appUrl],
        authorizedRedirectUris: [config.callbackUrl]
      },
      requestId
    );
  });
}

