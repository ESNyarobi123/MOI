import { Redis } from "@upstash/redis";

let redis: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redis !== undefined) return redis;
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = null;
    return null;
  }
  redis = Redis.fromEnv();
  return redis;
}

const PREFIX = "moidate:cache:";

export async function cacheGetJson<T>(key: string): Promise<T | null> {
  const r = getRedis();
  if (!r) return null;
  const raw = await r.get<string>(`${PREFIX}${key}`);
  if (raw == null) return null;
  try {
    return JSON.parse(typeof raw === "string" ? raw : JSON.stringify(raw)) as T;
  } catch {
    return null;
  }
}

export async function cacheSetJson<T>(key: string, value: T, ttlSec: number) {
  const r = getRedis();
  if (!r) return;
  await r.set(`${PREFIX}${key}`, JSON.stringify(value), { ex: ttlSec });
}
