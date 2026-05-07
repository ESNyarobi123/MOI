import { NextResponse, type NextRequest } from "next/server";
import { buildGoogleAuthUrl, getGoogleOAuthConfig } from "@/lib/auth/oauth";

export async function GET(request: NextRequest) {
  const appCallback =
    request.nextUrl.searchParams.get("appCallback") ?? "moidate://auth/callback";

  // Encode appCallback inside state so callback route can read it
  const statePayload = Buffer.from(
    JSON.stringify({ nonce: crypto.randomUUID(), appCallback })
  ).toString("base64url");

  const authUrl = buildGoogleAuthUrl(statePayload);

  // Direct browser redirect to Google (no JSON response — this IS the redirect)
  return NextResponse.redirect(authUrl, { status: 302 });
}
