import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * This route is ONLY used as a WebBrowser intercept target.
 * expo-web-browser intercepts navigation to this URL prefix and returns
 * it as result.url — the app never actually loads this page during normal OAuth.
 *
 * If somehow reached in a real browser (e.g. user opens link manually),
 * show a friendly message.
 */
export async function GET(request: NextRequest) {
  const accessToken = request.nextUrl.searchParams.get("accessToken");
  const error = request.nextUrl.searchParams.get("error");

  if (accessToken) {
    return new NextResponse(
      `<!doctype html><html><body style="font-family:sans-serif;text-align:center;padding:60px">
        <h2>✅ Signed in successfully!</h2>
        <p>You can close this tab and return to the app.</p>
      </body></html>`,
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  }

  return new NextResponse(
    `<!doctype html><html><body style="font-family:sans-serif;text-align:center;padding:60px">
      <h2>⚠️ Sign-in ${error ? "failed" : "incomplete"}</h2>
      <p>${error ?? "Please return to the app and try again."}</p>
    </body></html>`,
    { status: 200, headers: { "Content-Type": "text/html" } }
  );
}
