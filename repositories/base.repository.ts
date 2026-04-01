import { ForbiddenError, NotFoundError } from "@/dtos/errors";

export class BaseRepository {
  protected assertFound<T>(value: T | null, message = "Recurso nao encontrado"): T {
    if (!value) {
      throw new NotFoundError(message);
    }

    return value;
  }

  protected assertOwnership(isOwner: boolean, message = "Sem permissao para este recurso") {
    if (!isOwner) {
      throw new ForbiddenError(message);
    }
  }
}
