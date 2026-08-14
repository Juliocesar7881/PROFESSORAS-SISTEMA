import { Redis } from "@upstash/redis";

import { env } from "@/lib/env";

function isPlaceholder(value: string) {
  const normalized = value.trim().toLowerCase();

  return (
    normalized === "" ||
    normalized.includes("example.") ||
    normalized.includes("example_") ||
    normalized.includes("your_") ||
    normalized.includes("replace_me")
  );
}

export const isUpstashConfigured =
  !isPlaceholder(env.UPSTASH_REDIS_REST_URL) && !isPlaceholder(env.UPSTASH_REDIS_REST_TOKEN);

export const redis = isUpstashConfigured
  ? new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;
