import { Plano } from "@prisma/client";
import { Session } from "next-auth";
import type { Duration } from "@upstash/ratelimit";

import { UnauthorizedError, PlanLimitError } from "@/dtos/errors";
import { env } from "@/lib/env";
import { requireSession } from "@/lib/session";
import { AuditRepository } from "@/repositories/audit.repository";
import { enforceRateLimit, enforcePlanAwareRateLimit } from "@/lib/rate-limit";

type RouteHandler = (request: Request, context: RequestContext) => Promise<Response>;

export interface RequestContext {
  session: Session | null;
  userId: string | null;
  plano: Plano;
  ip: string | null;
  userAgent: string | null;
}

const defaultContext: RequestContext = {
  session: null,
  userId: null,
  plano: Plano.GRATUITO,
  ip: null,
  userAgent: null,
};

function withRequestMeta(context: RequestContext, request: Request): RequestContext {
  const requestHeaders = request.headers;
  return {
    ...context,
    ip: requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: requestHeaders.get("user-agent") ?? null,
  };
}

export function withAuth(handler: RouteHandler): RouteHandler {
  return async (request, context) => {
    const session = await requireSession();

    if (!session.user?.id) {
      throw new UnauthorizedError();
    }

    return handler(request, {
      ...withRequestMeta(context, request),
      session,
      userId: session.user.id,
      plano: session.user.plano,
    });
  };
}

export function withPlan(requiredPlan: Plano) {
  return (handler: RouteHandler): RouteHandler => {
    return async (request, context) => {
      if (!context.userId) {
        throw new UnauthorizedError();
      }

      if (requiredPlan === Plano.PRO && context.plano !== Plano.PRO) {
        throw new PlanLimitError("Funcionalidade exclusiva do Plano Pro", env.STRIPE_UPGRADE_URL);
      }

      return handler(request, context);
    };
  };
}

export function withRateLimit(params: {
  keyPrefix: string;
  by: "user" | "ip";
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
          plan: context.plano,
          prefix: params.keyPrefix,
          freeLimit: params.planAware.freeLimit,
          proLimit: params.planAware.proLimit,
          window: params.planAware.window,
        });
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

        await auditRepository.log({
          userId: context.userId,
          action: params.action,
          resource: params.resource,
          ip: context.ip,
          userAgent: context.userAgent,
        });
      }

      return response;
    };
  };
}

export function route(handler: RouteHandler, wrappers: Array<(handler: RouteHandler) => RouteHandler> = []) {
  const composed = wrappers.reduceRight((acc, wrapper) => wrapper(acc), handler);

  return async (request: Request) => {
    return composed(request, withRequestMeta(defaultContext, request));
  };
}
