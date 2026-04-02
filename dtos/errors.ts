export class DomainError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, status: number, code: string, details?: unknown) {
    super(message);
    this.name = "DomainError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends DomainError {
  constructor(message = "Dados de entrada inválidos", details?: unknown) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = "Não autenticado") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = "Sem permissão para este recurso") {
    super(message, 403, "FORBIDDEN");
  }
}

export class NotFoundError extends DomainError {
  constructor(message = "Recurso não encontrado") {
    super(message, 404, "NOT_FOUND");
  }
}

export class PlanLimitError extends DomainError {
  public readonly upgradeUrl: string;

  constructor(message: string, upgradeUrl: string) {
    super(message, 402, "PLAN_REQUIRED");
    this.upgradeUrl = upgradeUrl;
  }
}

export class ConflictError extends DomainError {
  constructor(message = "Conflito de dados") {
    super(message, 409, "CONFLICT");
  }
}

export class RateLimitError extends DomainError {
  constructor(message = "Limite de requisições excedido", details?: unknown) {
    super(message, 429, "RATE_LIMITED", details);
  }
}
