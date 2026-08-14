import { prisma } from "@/lib/prisma";
import { BaseRepository } from "@/repositories/base.repository";
import type { CreateTurmaInput, UpdateTurmaInput } from "@/dtos/turma.dto";

export class TurmaRepository extends BaseRepository {
  async create(userId: string, data: CreateTurmaInput) {
    return prisma.turma.create({
      data: {
        userId,
        nome: data.nome,
        faixaEtaria: data.faixaEtaria || null,
        turno: data.turno || null,
        instituicao: data.instituicao || null,
        ano: data.ano ?? null,
      },
    });
  }

  async listByUser(userId: string, lixeira = false) {
    return prisma.turma.findMany({
      where: {
        userId,
        deletedAt: lixeira ? { not: null } : null,
      },
      orderBy: [{ nome: "asc" }, { createdAt: "desc" }],
      include: {
        _count: {
          select: {
            alunos: {
              where: { deletedAt: null },
            },
          },
        },
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

    return this.assertFound(turma, "Turma não encontrada");
  }

  async update(userId: string, turmaId: string, data: UpdateTurmaInput) {
    const turma = await this.findOwnedById(userId, turmaId);

    return prisma.turma.update({
      where: { id: turma.id },
      data,
    });
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

  async restore(userId: string, turmaId: string) {
    const turma = await this.findOwnedById(userId, turmaId);

    return prisma.turma.update({
      where: { id: turma.id },
      data: { deletedAt: null },
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
