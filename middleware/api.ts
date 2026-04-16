import { Plano } from "@prisma/client";
import { Session } from "next-auth";
import type { Duration } from "@upstash/ratelimit";

import { DomainError, PlanLimitError, ServiceUnavailableError, UnauthorizedError } from "@/dtos/errors";
import { env } from "@/lib/env";
import { fail } from "@/lib/http";
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

const TRIAL_EXEMPT_API_PATHS = new Set([
  "/api/stripe/checkout",
  "/api/account",
  "/api/account/logout-all",
]);

function isTrialExemptPath(pathname: string) {
  return TRIAL_EXEMPT_API_PATHS.has(pathname);
}

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

    const pathname = new URL(request.url).pathname;

    if (session.user.plano !== Plano.PRO && session.user.trialExpired && !isTrialExemptPath(pathname)) {
      throw new PlanLimitError("Seu período grátis de 14 dias terminou. Ative o Pro para continuar.", env.STRIPE_UPGRADE_URL);
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

      const hasTrialProAccess = context.session?.user?.trialExpired === false;

      if (requiredPlan === Plano.PRO && context.plano !== Plano.PRO && !hasTrialProAccess) {
        throw new PlanLimitError("Funcionalidade exclusiva do Plano Pro", env.STRIPE_UPGRADE_URL);
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
          const effectivePlan =
            context.plano === Plano.PRO || context.session?.user?.trialExpired === false
              ? Plano.PRO
              : context.plano;

          await enforcePlanAwareRateLimit({
            key: rateKey,
            plan: effectivePlan,
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
    try {
      return await composed(request, withRequestMeta(defaultContext, request));
    } catch (error) {
      return fail(error);
    }
  };
}
