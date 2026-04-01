import { prisma } from "@/lib/prisma";
import { BaseRepository } from "@/repositories/base.repository";
import type { CreateTurmaInput } from "@/dtos/turma.dto";

export class TurmaRepository extends BaseRepository {
  async create(userId: string, data: CreateTurmaInput) {
    return prisma.turma.create({
      data: {
        userId,
        nome: data.nome,
        faixaEtaria: data.faixaEtaria,
        ano: data.ano,
      },
    });
  }

  async listByUser(userId: string) {
    return prisma.turma.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findOwnedById(userId: string, turmaId: string) {
    const turma = await prisma.turma.findFirst({
      where: {
        id: turmaId,
        userId,
      },
    });

    return this.assertFound(turma, "Turma nao encontrada");
  }

  async softDelete(userId: string, turmaId: string) {
    const turma = await this.findOwnedById(userId, turmaId);

    return prisma.turma.update({
      where: { id: turma.id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async hardDeleteExpired(cutoff: Date) {
    return prisma.turma.deleteMany({
      where: {
        deletedAt: {
          lt: cutoff,
        },
      },
    });
  }
}
