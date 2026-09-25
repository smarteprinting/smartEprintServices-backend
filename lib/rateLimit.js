import { Redis } from "@upstash/redis/cloudflare";

let redisClient;

function getRedisClient() {
  if (redisClient) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  redisClient = new Redis({ url, token });
  return redisClient;
}

function getClientIp(request) {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

function getPolicy(pathname) {
  pathname = pathname.replace(/\/+$/, "") || "/";

  if (pathname === "/api/auth/login" || pathname === "/api/admin/login") {
    return { limit: 10, windowSeconds: 900, name: "login" };
  }

  if (pathname === "/api/contact" || pathname === "/api/book-appointment") {
    return { limit: 5, windowSeconds: 600, name: "form" };
  }

  return { limit: 120, windowSeconds: 300, name: "api" };
}

export async function checkRateLimit(request) {
  const redis = getRedisClient();
  const isProduction = process.env.NODE_ENV === "production";

  if (!redis) {
    if (isProduction) {
      return { allowed: false, retryAfter: 300, configurationMissing: true };
    }
    return { allowed: true };
  }

  const policy = getPolicy(request.nextUrl.pathname);
  const bucket = Math.floor(Date.now() / 1000 / policy.windowSeconds);
  const key = `smarteprint:ratelimit:${policy.name}:${getClientIp(request)}:${bucket}`;

  try {
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, policy.windowSeconds);

    return {
      allowed: count <= policy.limit,
      retryAfter: policy.windowSeconds,
    };
  } catch {
    return isProduction
      ? { allowed: false, retryAfter: 300, serviceUnavailable: true }
      : { allowed: true };
  }
}