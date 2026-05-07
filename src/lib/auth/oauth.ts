import { AppError } from "@/utils/app-error";

export type GoogleUserProfile = {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
};

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new AppError(
      "SERVICE_UNAVAILABLE",
      `Missing OAuth configuration: ${name}`,
      503
    );
  }
  return value;
}

export function getGoogleOAuthConfig() {
  const clientId = requireEnv("GOOGLE_CLIENT_ID");
  const clientSecret = requireEnv("GOOGLE_CLIENT_SECRET");
  const appUrl = process.env.APP_URL?.trim() || "http://localhost:3000";
  const apiBaseUrl =
    process.env.API_BASE_URL?.trim() ||
    process.env.PUBLIC_API_BASE_URL?.trim() ||
    process.env.PUBLIC_APP_URL?.trim() ||
    "http://localhost:3000";
  const callbackUrl = `${apiBaseUrl.replace(/\/+$/, "")}/api/v1/auth/google/callback`;
  return {
    clientId,
    clientSecret,
    appUrl,
    apiBaseUrl,
    callbackUrl
  };
}

export function buildGoogleAuthUrl(state: string, redirectUri?: string) {
  const { clientId, callbackUrl } = getGoogleOAuthConfig();
  const uri = redirectUri || callbackUrl;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: uri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "consent"
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleCodeForTokens(input: {
  code: string;
  redirectUri: string;
}) {
  const { clientId, clientSecret } = getGoogleOAuthConfig();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: input.code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: input.redirectUri,
      grant_type: "authorization_code"
    }).toString()
  });

  if (!response.ok) {
    const text = await response.text();
    throw new AppError(
      "UNAUTHORIZED",
      "Google token exchange failed.",
      401,
      { provider: "google", response: text }
    );
  }

  const data = (await response.json()) as {
    access_token?: string;
    id_token?: string;
  };
  if (!data.access_token) {
    throw new AppError("UNAUTHORIZED", "Google access token missing.", 401);
  }

  return {
    accessToken: data.access_token,
    idToken: data.id_token ?? null
  };
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleUserProfile> {
  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
  );
  if (!response.ok) {
    throw new AppError("UNAUTHORIZED", "Invalid Google ID token.", 401);
  }
  const data = (await response.json()) as GoogleUserProfile & { aud?: string };
  if (!data.sub || !data.email) {
    throw new AppError("UNAUTHORIZED", "Google ID token missing required fields.", 401);
  }
  return data;
}

export async function fetchGoogleUserProfileByAccessToken(accessToken: string) {
  const response = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );
  if (!response.ok) {
    throw new AppError("UNAUTHORIZED", "Failed to fetch Google user profile.", 401);
  }

  const data = (await response.json()) as GoogleUserProfile;
  if (!data.sub || !data.email) {
    throw new AppError("UNAUTHORIZED", "Google profile missing required fields.", 401);
  }
  return data;
}

