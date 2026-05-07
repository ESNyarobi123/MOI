import { getUserAccessToken } from "./user-session";

export async function userFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = getUserAccessToken();
  const headers = new Headers(init?.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init?.body != null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const p = path.startsWith("/") ? path : `/${path}`;
  return fetch(`/api/v1${p}`, { ...init, headers });
}

type Envelope<T> =
  | { ok: true; data: T }
  | { ok: false; error: { message: string; code?: string } };

export async function userApiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await userFetch(path, init);
  const json = (await res.json()) as Envelope<T>;
  if (!json || typeof json !== "object" || !("ok" in json)) {
    throw new Error("Invalid API response");
  }
  if (!json.ok) {
    throw new Error(json.error?.message ?? `Request failed (${res.status})`);
  }
  return json.data;
}
