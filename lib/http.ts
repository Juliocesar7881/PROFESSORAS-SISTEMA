import { ZodError } from "zod";

import { DomainError, PlanLimitError, ValidationError } from "@/dtos/errors";
import type { ApiResult } from "@/models/types";

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
