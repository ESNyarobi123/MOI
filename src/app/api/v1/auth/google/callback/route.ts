import { NextResponse, type NextRequest } from "next/server";
import { getGoogleOAuthConfig } from "@/lib/auth/oauth";
import { authService } from "@/services/auth.service";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const errorParam = request.nextUrl.searchParams.get("error");

  // Decode appCallback from state  (state = base64(JSON{nonce,appCallback}))
  let appCallback: string | null = null;
  try {
    if (state) {
      // Try base64 (standard) first, then base64url
      const buf = Buffer.from(state, "base64");
      const decoded = JSON.parse(buf.toString("utf-8"));
      appCallback = decoded?.appCallback ?? null;
    }
  } catch {
    // state was a plain UUID or unparseable — no appCallback
  }

  function redirectToApp(params: Record<string, string>) {
    const target = appCallback ?? "https://apis.moidate.online/api/v1/auth/mobile-done";
    const url = new URL(target);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    return NextResponse.redirect(url.toString(), { status: 302 });
  }

  if (errorParam) {
    return redirectToApp({ error: errorParam });
  }

  if (!code) {
    return redirectToApp({ error: "missing_code" });
  }

  try {
    const { callbackUrl } = getGoogleOAuthConfig();
    const result = await authService.loginWithGoogle({ code, redirectUri: callbackUrl });
    return redirectToApp({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      tokenType: result.tokenType,
      provider: "google"
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[GoogleCallback] OAuth failed:", err);
    return redirectToApp({ error: message.slice(0, 200) });
  }
}
