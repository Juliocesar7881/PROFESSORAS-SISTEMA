import { Plano } from "@prisma/client";
import { Session } from "next-auth";
import type { Duration } from "@upstash/ratelimit";

import { DomainError, ForbiddenError, ServiceUnavailableError, UnauthorizedError } from "@/dtos/errors";
import { env } from "@/lib/env";
import { fail } from "@/lib/http";
import { requireSession } from "@/lib/session";
import { AuditRepository } from "@/repositories/audit.repository";
import { enforceRateLimit, enforcePlanAwareRateLimit } from "@/lib/rate-limit";
import { authenticateMobileRequest } from "@/lib/mobile-auth";

type RouteHandler = (request: Request, context: RequestContext) => Promise<Response>;

export interface RequestContext {
  requestId: string;
  session: Session | null;
  userId: string | null;
  plano: Plano;
  ip: string | null;
  userAgent: string | null;
  authKind: "web" | "mobile" | null;
  mobileSessionId: string | null;
}

const defaultContext: RequestContext = {
  requestId: "",
  session: null,
  userId: null,
  plano: Plano.GRATUITO,
  ip: null,
  userAgent: null,
  authKind: null,
  mobileSessionId: null,
};

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function withRequestMeta(context: RequestContext, request: Request): RequestContext {
  const requestHeaders = request.headers;
  return {
    ...context,
    ip: requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: requestHeaders.get("user-agent") ?? null,
  };
}

function assertSameOriginMutation(request: Request) {
  if (SAFE_METHODS.has(request.method.toUpperCase())) {
    return;
  }

  const requestOrigin = new URL(request.url).origin;
  const configuredOrigin = new URL(env.NEXT_PUBLIC_APP_URL).origin;
  const requestPath = new URL(request.url).pathname;
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  let sourceOrigin = origin && origin !== "null" ? origin : null;

  if (!sourceOrigin && referer) {
    try {
      sourceOrigin = new URL(referer).origin;
    } catch {
      throw new ForbiddenError("Origem da requisição não permitida");
    }
  }

  if (!sourceOrigin) {
    const bearer = request.headers.get("authorization") ?? "";
    const isMobileSession = /^Bearer\s+pm_[A-Za-z0-9_-]+$/i.test(bearer);
    const isMobileCodeExchange = requestPath === "/api/mobile/auth/exchange";

    if (isMobileSession || isMobileCodeExchange) return;
    throw new ForbiddenError("Origem da requisicao nao permitida");
  }

  const trustedOrigins = new Set([requestOrigin, configuredOrigin]);

  if (env.NODE_ENV !== "production") {
    const requestUrl = new URL(requestOrigin);
    if (requestUrl.hostname === "localhost" || requestUrl.hostname === "127.0.0.1") {
      const port = requestUrl.port ? `:${requestUrl.port}` : "";
      trustedOrigins.add(`${requestUrl.protocol}//localhost${port}`);
      trustedOrigins.add(`${requestUrl.protocol}//127.0.0.1${port}`);
    }
  }

  if (!trustedOrigins.has(sourceOrigin)) {
    throw new ForbiddenError("Origem da requisição não permitida");
  }
}

export function withAuth(handler: RouteHandler): RouteHandler {
  return async (request, context) => {
    const mobile = await authenticateMobileRequest(request);

    if (mobile) {
      return handler(request, {
        ...withRequestMeta(context, request),
        userId: mobile.user.id,
        plano: mobile.plan,
        authKind: "mobile",
        mobileSessionId: mobile.sessionId,
      });
    }

    const session = await requireSession();

    if (!session.user?.id) {
      throw new UnauthorizedError();
    }

    return handler(request, {
      ...withRequestMeta(context, request),
      session,
      userId: session.user.id,
      plano: session.user.plano,
      authKind: "web",
      mobileSessionId: null,
    });
  };
}

export function withPlan(requiredPlan: Plano) {
  void requiredPlan;

  return (handler: RouteHandler): RouteHandler => {
    return async (request, context) => {
      if (!context.userId) {
        throw new UnauthorizedError();
      }

      return handler(request, context);
    };
  };
}

export function withRateLimit(params: {
  keyPrefix: string;
  by: "user" | "ip";
  failOpen?: boolean;
  fixed?: {
    points: number;
    window: Duration;
  };
  planAware?: {
    freeLimit: number;
    proLimit: number;
    window: Duration;
  };
}) {
  return (handler: RouteHandler): RouteHandler => {
    return async (request, context) => {
      const rateKey = params.by === "user" ? context.userId : context.ip;

      if (!rateKey) {
        throw new UnauthorizedError();
      }

      try {
        if (params.fixed) {
          await enforceRateLimit({
            key: rateKey,
            prefix: params.keyPrefix,
            points: params.fixed.points,
            window: params.fixed.window,
          });
        }

        if (params.planAware) {
          await enforcePlanAwareRateLimit({
            key: rateKey,
            plan: Plano.PRO,
            prefix: params.keyPrefix,
            freeLimit: params.planAware.freeLimit,
            proLimit: params.planAware.proLimit,
            window: params.planAware.window,
          });
        }
      } catch (error) {
        if (error instanceof DomainError) {
          throw error;
        }

        if (params.failOpen) {
          console.error("[rate-limit] backend unavailable, allowing request", error);
          return handler(request, context);
        }

        throw new ServiceUnavailableError("Serviço de proteção temporariamente indisponível");
      }

      return handler(request, context);
    };
  };
}

export function withAudit(params: { action: string; resource: string }) {
  return (handler: RouteHandler): RouteHandler => {
    return async (request, context) => {
      const response = await handler(request, context);

      if (context.userId) {
        const auditRepository = new AuditRepository();

        void auditRepository.log({
          userId: context.userId,
          action: params.action,
          resource: params.resource,
          ip: context.ip,
          userAgent: context.userAgent,
        }).catch((error) => {
          console.error("[audit] failed to write log", error);
        });
      }

      return response;
    };
  };
}

export function route(handler: RouteHandler, wrappers: Array<(handler: RouteHandler) => RouteHandler> = []) {
  const composed = wrappers.reduceRight((acc, wrapper) => wrapper(acc), handler);

  return async (request: Request) => {
    const requestId = crypto.randomUUID();

    try {
      assertSameOriginMutation(request);
      return await composed(request, withRequestMeta({ ...defaultContext, requestId }, request));
    } catch (error) {
      return fail(error, requestId);
    }
  };
}
