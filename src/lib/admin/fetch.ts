export const ADMIN_TOKEN_KEY = "moidate_admin_access";

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string) {
  sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken() {
  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
}

export async function adminFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = getAdminToken();
  const headers = new Headers(init?.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  headers.set("x-request-id", crypto.randomUUID());
  if (init?.body != null && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  return fetch(`/api/v1${path}`, { ...init, headers });
}

export async function adminJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await adminFetch(path, init);
  const json = (await res.json()) as {
    ok: boolean;
    data?: T;
    error?: { message?: string };
  };
  if (!res.ok || !json.ok) {
    throw new Error(json.error?.message || `Request failed (${res.status})`);
  }
  return json.data as T;
}
