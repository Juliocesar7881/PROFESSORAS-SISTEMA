import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Plano } from "@prisma/client";

import { RateLimitError } from "@/dtos/errors";
import { redis } from "@/lib/upstash";

const limiterCache = new Map<string, Ratelimit>();

function getLimiter(prefix: string, points: number, window: Duration): Ratelimit {
  const cacheKey = `${prefix}:${points}:${window}`;
  const cached = limiterCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(points, window),
    prefix,
  });

  limiterCache.set(cacheKey, limiter);
  return limiter;
}

export interface LimitOptions {
  key: string;
  points: number;
  window: Duration;
  prefix: string;
}

export async function enforceRateLimit(options: LimitOptions) {
  const limiter = getLimiter(options.prefix, options.points, options.window);
  const result = await limiter.limit(options.key);

  if (!result.success) {
    throw new RateLimitError("Limite de requisicoes excedido", {
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    });
  }

  return result;
}

export async function enforcePlanAwareRateLimit(params: {
  key: string;
  plan: Plano;
  prefix: string;
  freeLimit: number;
  proLimit: number;
  window: Duration;
}) {
  const points = params.plan === Plano.PRO ? params.proLimit : params.freeLimit;

  return enforceRateLimit({
    key: params.key,
    points,
    window: params.window,
    prefix: params.prefix,
  });
}
