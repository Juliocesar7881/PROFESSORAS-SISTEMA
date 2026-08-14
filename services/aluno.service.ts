import type { AlunoQueryInput, CreateAlunoInput, UpdateAlunoInput } from "@/dtos/aluno.dto";
import { AlunoRepository } from "@/repositories/aluno.repository";

export class AlunoService {
  private readonly alunoRepository = new AlunoRepository();

  async list(userId: string, query: AlunoQueryInput) {
    return this.alunoRepository.listByUserPaginated(userId, query);
  }

  async create(userId: string, payload: CreateAlunoInput) {
    return this.alunoRepository.create(userId, payload);
  }

  async detail(userId: string, alunoId: string) {
    return this.alunoRepository.findOwnedById(userId, alunoId);
  }

  async update(userId: string, alunoId: string, payload: UpdateAlunoInput) {
    return this.alunoRepository.update(userId, alunoId, payload);
  }

  async remove(userId: string, alunoId: string) {
    return this.alunoRepository.softDelete(userId, alunoId);
  }

  async restore(userId: string, alunoId: string) {
    return this.alunoRepository.restore(userId, alunoId);
  }

  async listWithoutRecentObservations(userId: string) {
    return this.alunoRepository.listWithoutRecentObservation(userId, 14);
  }
}
