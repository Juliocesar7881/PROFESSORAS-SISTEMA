import { z } from "zod";

const trimInput = (value: unknown) => (typeof value === "string" ? value.trim() : value);

const trimmedString = () => z.preprocess(trimInput, z.string());
const trimmedNonEmptyString = () => z.preprocess(trimInput, z.string().min(1));
const trimmedUrl = () => z.preprocess(trimInput, z.string().url());

const envSchema = z.object({
  NODE_ENV: z.preprocess(trimInput, z.enum(["development", "test", "production"]).default("development")),
  NEXT_PUBLIC_APP_URL: trimmedUrl(),
  AUTH_SECRET: z.preprocess(trimInput, z.string().min(32)),
  AUTH_GOOGLE_ID: trimmedNonEmptyString(),
  AUTH_GOOGLE_SECRET: trimmedNonEmptyString(),
  DATABASE_URL: trimmedNonEmptyString(),
  DIRECT_URL: trimmedNonEmptyString(),
  SUPABASE_URL: trimmedUrl(),
  SUPABASE_SERVICE_ROLE_KEY: trimmedNonEmptyString(),
  SUPABASE_STORAGE_BUCKET: trimmedNonEmptyString(),
  UPSTASH_REDIS_REST_URL: trimmedUrl(),
  UPSTASH_REDIS_REST_TOKEN: trimmedNonEmptyString(),
  GEMINI_API_KEY: trimmedNonEmptyString(),
  STRIPE_SECRET_KEY: trimmedNonEmptyString(),
  STRIPE_WEBHOOK_SECRET: trimmedNonEmptyString(),
  STRIPE_PRICE_MONTHLY: trimmedString().optional(),
  STRIPE_PRICE_YEARLY: trimmedString().optional(),
  STRIPE_UPGRADE_URL: trimmedUrl(),
  SENTRY_DSN: trimmedString().optional(),
  NEXT_PUBLIC_SENTRY_DSN: trimmedString().optional(),
  CRON_SECRET: trimmedNonEmptyString(),
});

export const env = envSchema.parse(process.env);
