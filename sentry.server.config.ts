import * as Sentry from "@sentry/nextjs";

import { sanitizeUnknown } from "@/lib/sentry-sanitize";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  sendDefaultPii: false,
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.2,
  beforeSend(event) {
    return {
      ...event,
      message: event.message ? String(sanitizeUnknown(event.message)) : event.message,
      extra: sanitizeUnknown(event.extra) as Record<string, unknown> | undefined,
      contexts: sanitizeUnknown(event.contexts) as typeof event.contexts,
      request: sanitizeUnknown(event.request) as typeof event.request,
      user: undefined,
    };
  },
});
