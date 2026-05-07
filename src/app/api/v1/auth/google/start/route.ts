import { NextResponse, type NextRequest } from "next/server";
import { buildGoogleAuthUrl } from "@/lib/auth/oauth";

export async function GET(request: NextRequest) {
  const appCallback =
    request.nextUrl.searchParams.get("appCallback") ?? "moidate://auth/callback";

  try {
    // Encode appCallback inside state so the callback route can redirect back to app
    const statePayload = Buffer.from(
      JSON.stringify({ nonce: crypto.randomUUID(), appCallback })
    ).toString("base64");

    const authUrl = buildGoogleAuthUrl(statePayload);
    return NextResponse.redirect(authUrl, { status: 302 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "OAuth configuration error";
    // Redirect back to app with error instead of returning 500
    const fallback = new URL(appCallback);
    fallback.searchParams.set("error", msg);
    return NextResponse.redirect(fallback.toString(), { status: 302 });
  }
}
