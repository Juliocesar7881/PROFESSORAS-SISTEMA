import { ZodError } from "zod";

import { DomainError, PlanLimitError, ValidationError } from "@/dtos/errors";
import type { ApiResult } from "@/models/types";

const REDACTION_PATTERNS: Array<[RegExp, string]> = [
  [/postgres(?:ql)?:\/\/[^@\s]+@/gi, "postgresql://[redacted]@"],
  [/(password=)[^&\s]+/gi, "$1[redacted]"],
  [/(token=)[^&\s]+/gi, "$1[redacted]"],
  [/(secret=)[^&\s]+/gi, "$1[redacted]"],
  [/(key=)[^&\s]+/gi, "$1[redacted]"],
];

const DATABASE_UNAVAILABLE_CODES = new Set([
  "ECONNREFUSED",
  "ECONNRESET",
  "ETIMEDOUT",
  "P1000",
  "P1001",
  "P1002",
  "P1017",
]);

function createRequestId() {
  return crypto.randomUUID();
}

function redact(value: unknown) {
  let output = typeof value === "string" ? value : String(value ?? "");

  for (const [pattern, replacement] of REDACTION_PATTERNS) {
    output = output.replace(pattern, replacement);
  }

  return output.slice(0, 1200);
}

function getErrorSummary(error: unknown) {
  if (!error || typeof error !== "object") {
    return {
      message: redact(error),
    };
  }

  const candidate = error as {
    name?: unknown;
    code?: unknown;
    message?: unknown;
  };

  return {
    name: typeof candidate.name === "string" ? redact(candidate.name) : undefined,
    code: typeof candidate.code === "string" ? redact(candidate.code) : undefined,
    message: typeof candidate.message === "string" ? redact(candidate.message) : undefined,
  };
}

export function logServerError(scope: string, error: unknown, metadata?: Record<string, unknown>) {
  console.error(scope, {
    ...metadata,
    error: getErrorSummary(error),
  });
}

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

export function fail(error: unknown, requestId = createRequestId()): Response {
  if (error instanceof ZodError) {
    return fail(new ValidationError("Payload invalido", error.flatten()), requestId);
  }

  if (error instanceof PlanLimitError) {
    return Response.json(
      {
        data: null,
        error: {
          code: error.code,
          message: error.message,
          upgradeUrl: error.upgradeUrl,
          requestId,
        },
      },
      { status: error.status },
    );
  }

  if (isDatabaseUnavailableError(error)) {
    logServerError("[api] database unavailable", error, { requestId });

    return Response.json(
      {
        data: null,
        error: {
          code: "DATABASE_UNAVAILABLE",
          message: "Banco de dados indisponivel. Verifique a conexao com o Supabase e as variaveis DATABASE_URL/DIRECT_URL.",
          requestId,
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
          requestId,
        },
      },
      { status: error.status },
    );
  }

  logServerError("[api] unexpected failure", error, { requestId });

  return Response.json(
    {
      data: null,
      error: {
        code: "INTERNAL_ERROR",
        message: "Erro interno inesperado",
        requestId,
      },
    },
    { status: 500 },
  );
}
