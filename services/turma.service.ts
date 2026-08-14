import type { CreateTurmaInput, UpdateTurmaInput } from "@/dtos/turma.dto";
import { TurmaRepository } from "@/repositories/turma.repository";

export class TurmaService {
  private readonly turmaRepository = new TurmaRepository();

  async create(userId: string, payload: CreateTurmaInput) {
    return this.turmaRepository.create(userId, payload);
  }

  async list(userId: string, lixeira = false) {
    return this.turmaRepository.listByUser(userId, lixeira);
  }

  async update(userId: string, turmaId: string, payload: UpdateTurmaInput) {
    return this.turmaRepository.update(userId, turmaId, payload);
  }

  async remove(userId: string, turmaId: string) {
    return this.turmaRepository.softDelete(userId, turmaId);
  }

  async restore(userId: string, turmaId: string) {
    return this.turmaRepository.restore(userId, turmaId);
  }
}
