export const USER_ACCESS_KEY = "moidate_user_access";
export const USER_REFRESH_KEY = "moidate_user_refresh";

export function persistUserSession(accessToken: string, refreshToken: string) {
  sessionStorage.setItem(USER_ACCESS_KEY, accessToken);
  sessionStorage.setItem(USER_REFRESH_KEY, refreshToken);
}

export function clearUserSession() {
  sessionStorage.removeItem(USER_ACCESS_KEY);
  sessionStorage.removeItem(USER_REFRESH_KEY);
}

export function getUserAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(USER_ACCESS_KEY);
}
