type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitEntry>();

export type RateLimitDecision = Readonly<{
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}>;

export function requestClientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return request.headers.get("x-real-ip")?.trim() || forwarded || "unknown";
}

export function applyInMemoryRateLimit(
  key: string,
  limit: number,
  windowMilliseconds: number,
  now = Date.now(),
): RateLimitDecision {
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMilliseconds });
    return {
      allowed: true,
      remaining: Math.max(0, limit - 1),
      retryAfterSeconds: Math.ceil(windowMilliseconds / 1000),
    };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: limit - existing.count,
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}
