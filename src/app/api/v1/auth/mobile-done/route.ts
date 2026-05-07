import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const accessToken = params.get("accessToken");
  const refreshToken = params.get("refreshToken");
  const error = params.get("error");

  // Build the deep-link URL back to the app
  const deepLink = new URL("moidate://auth/callback");
  params.forEach((v, k) => deepLink.searchParams.set(k, v));
  const deepLinkUrl = deepLink.toString();

  const isSuccess = !!accessToken && !error;

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${isSuccess ? "Signed in" : "Sign-in failed"} — MoiDate</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{
      min-height:100vh;display:flex;flex-direction:column;
      align-items:center;justify-content:center;padding:32px;
      background:linear-gradient(135deg,#c34a7f,#8a2f7d);
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
      color:#fff;text-align:center;gap:20px;
    }
    .card{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.25);
      border-radius:24px;padding:32px 28px;max-width:380px;width:100%;
      backdrop-filter:blur(16px);}
    .icon{font-size:52px;margin-bottom:8px;}
    h1{font-size:22px;font-weight:800;margin-bottom:8px;}
    p{font-size:14px;opacity:.85;line-height:1.6;margin-bottom:24px;}
    .btn{
      display:inline-flex;align-items:center;justify-content:center;
      width:100%;padding:16px;border-radius:999px;border:none;cursor:pointer;
      font-size:16px;font-weight:800;text-decoration:none;
      background:#fff;color:#8a2f7d;
    }
    .btn:active{opacity:.85;}
    .sub{font-size:12px;opacity:.6;margin-top:16px;}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${isSuccess ? "✅" : "⚠️"}</div>
    <h1>${isSuccess ? "Signed in successfully!" : "Sign-in failed"}</h1>
    <p>${isSuccess
      ? "Tap below to return to MoiDate and continue."
      : `Something went wrong: <strong>${error ?? "unknown error"}</strong><br/>Please close this and try again.`
    }</p>
    ${isSuccess ? `<a class="btn" href="${deepLinkUrl}" id="openBtn">Open MoiDate ↗</a>` : ""}
    <p class="sub">You can close this tab at any time.</p>
  </div>
  <script>
    // Attempt auto-redirect to app immediately
    ${isSuccess ? `
    try { window.location.href = "${deepLinkUrl}"; } catch(e) {}
    // Fallback: auto-click after 800ms if still here
    setTimeout(function(){
      var btn = document.getElementById('openBtn');
      if(btn) btn.click();
    }, 800);
    ` : ""}
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
