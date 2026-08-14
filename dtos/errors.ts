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
  constructor(message = "Conflito de dados", details?: unknown) {
    super(message, 409, "CONFLICT", details);
  }
}

export class RateLimitError extends DomainError {
  constructor(message = "Limite de requisições excedido", details?: unknown) {
    super(message, 429, "RATE_LIMITED", details);
  }
}

export class ServiceUnavailableError extends DomainError {
  constructor(message = "Serviço temporariamente indisponível", details?: unknown) {
    super(message, 503, "SERVICE_UNAVAILABLE", details);
  }
}

export class PayloadTooLargeError extends DomainError {
  constructor(message = "Arquivo grande demais", details?: unknown) {
    super(message, 413, "FILE_TOO_LARGE", details);
  }
}

export class UnsupportedMediaTypeError extends DomainError {
  constructor(message = "Formato de arquivo nao suportado", details?: unknown) {
    super(message, 415, "INVALID_IMAGE", details);
  }
}

export class PhotoUploadNotReadyError extends DomainError {
  constructor(message = "A foto ainda nao chegou ao armazenamento", details?: unknown) {
    super(message, 409, "PHOTO_UPLOAD_NOT_READY", details);
  }
}
