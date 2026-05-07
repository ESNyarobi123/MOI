import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = Number(process.env.API_RATE_LIMIT_PER_MIN ?? 120);

const memoryBuckets = new Map<string, { count: number; reset: number }>();

function memoryLimit(key: string): { success: boolean } {
  const now = Date.now();
  const b = memoryBuckets.get(key);
  if (!b || now > b.reset) {
    memoryBuckets.set(key, { count: 1, reset: now + WINDOW_MS });
    return { success: true };
  }
  if (b.count >= MAX_REQUESTS) {
    return { success: false };
  }
  b.count += 1;
  return { success: true };
}

let upstashLimiter: Ratelimit | null = null;

function getUpstashLimiter() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  if (!upstashLimiter) {
    const redis = Redis.fromEnv();
    upstashLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(MAX_REQUESTS, "60 s"),
      prefix: "moidate:rl"
    });
  }
  return upstashLimiter;
}

export async function checkApiRateLimit(key: string): Promise<{ success: boolean }> {
  const limiter = getUpstashLimiter();
  if (limiter) {
    const { success } = await limiter.limit(key);
    return { success };
  }
  return memoryLimit(key);
}
