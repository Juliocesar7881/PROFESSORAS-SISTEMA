import { ZodError } from "zod";

import { DomainError, PlanLimitError, ValidationError } from "@/dtos/errors";
import type { ApiResult } from "@/models/types";

const DATABASE_UNAVAILABLE_CODES = new Set([
  "ECONNREFUSED",
  "ECONNRESET",
  "ETIMEDOUT",
  "P1000",
  "P1001",
  "P1002",
  "P1017",
]);

function isDatabaseUnavailableError(error: unknown): error is {
  name?: string;
  code?: string;
  message?: string;
} {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    name?: unknown;
    code?: unknown;
    message?: unknown;
  };

  const code = typeof candidate.code === "string" ? candidate.code : "";
  if (DATABASE_UNAVAILABLE_CODES.has(code)) {
    return true;
  }

  const name = typeof candidate.name === "string" ? candidate.name : "";
  const message = typeof candidate.message === "string" ? candidate.message.toLowerCase() : "";

  if (name === "PrismaClientInitializationError") {
    return true;
  }

  if (name !== "PrismaClientKnownRequestError") {
    return false;
  }

  return (
    message.includes("can't reach database") ||
    message.includes("connection refused") ||
    message.includes("timeout") ||
    message.includes("econnrefused")
  );
}

export function ok<T>(data: T, status = 200): Response {
  const payload: ApiResult<T> = {
    data,
    error: null,
  };

  return Response.json(payload, { status });
}

export function fail(error: unknown): Response {
  if (error instanceof ZodError) {
    return fail(new ValidationError("Payload inválido", error.flatten()));
  }

  if (error instanceof PlanLimitError) {
    return Response.json(
      {
        data: null,
        error: {
          code: error.code,
          message: error.message,
          upgradeUrl: error.upgradeUrl,
        },
      },
      { status: error.status },
    );
  }

  if (isDatabaseUnavailableError(error)) {
    return Response.json(
      {
        data: null,
        error: {
          code: "DATABASE_UNAVAILABLE",
          message: "Banco de dados indisponível. Verifique a conexão com o Supabase e as variáveis DATABASE_URL/DIRECT_URL.",
          ...(process.env.NODE_ENV === "development"
            ? {
                details: {
                  reason: error.code,
                },
              }
            : {}),
        },
      },
      { status: 503 },
    );
  }

  if (error instanceof DomainError) {
    return Response.json(
      {
        data: null,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.status },
    );
  }

  return Response.json(
    {
      data: null,
      error: {
        code: "INTERNAL_ERROR",
        message: "Erro interno inesperado",
      },
    },
    { status: 500 },
  );
}
