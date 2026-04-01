import type { CreateTurmaInput } from "@/dtos/turma.dto";
import { TurmaRepository } from "@/repositories/turma.repository";

export class TurmaService {
  private readonly turmaRepository = new TurmaRepository();

  async create(userId: string, payload: CreateTurmaInput) {
    return this.turmaRepository.create(userId, payload);
  }

  async list(userId: string) {
    return this.turmaRepository.listByUser(userId);
  }
}
