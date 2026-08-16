import type { Prisma } from "@prisma/client";

import type { CreateAlunoInput, UpdateAlunoInput } from "@/dtos/aluno.dto";
import { prisma } from "@/lib/prisma";
import { BaseRepository } from "@/repositories/base.repository";

export class AlunoRepository extends BaseRepository {
  private async assertTurmaOwnership(userId: string, turmaId: string) {
    const turma = await prisma.turma.findFirst({
      where: {
        id: turmaId,
        userId,
      },
      select: {
        id: true,
      },
    });

    this.assertFound(turma, "Turma não encontrada");
  }

  private buildListWhere(userId: string, turmaId?: string, busca?: string): Prisma.AlunoWhereInput {
    const where: Prisma.AlunoWhereInput = {
      deletedAt: null,
      userId,
      turma: { deletedAt: null },
    };

    if (turmaId) {
      where.turmaId = turmaId;
    }

    if (busca) {
      where.nome = {
        contains: busca,
        mode: "insensitive",
      };
    }

    return where;
  }

  async listByUser(userId: string, turmaId?: string) {
    return prisma.aluno.findMany({
      where: this.buildListWhere(userId, turmaId),
      orderBy: {
        nome: "asc",
      },
      include: {
        turma: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });
  }

  async countByUser(userId: string) {
    return prisma.aluno.count({
      where: {
        deletedAt: null,
        turma: {
          userId,
          deletedAt: null,
        },
      },
    });
  }

  async create(userId: string, data: CreateAlunoInput) {
    await this.assertTurmaOwnership(userId, data.turmaId);

    return prisma.aluno.create({
      data: {
        nome: data.nome,
        dataNasc: data.dataNasc ?? null,
        contexto: data.contexto || null,
        turmaId: data.turmaId,
        userId,
      },
      include: {
        turma: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });
  }

  async findOwnedById(userId: string, alunoId: string) {
    const aluno = await prisma.aluno.findFirst({
      where: {
        id: alunoId,
        userId,
      },
      include: {
        turma: true,
      },
    });

    return this.assertFound(aluno, "Aluno não encontrado");
  }

  async update(userId: string, alunoId: string, data: UpdateAlunoInput) {
    const aluno = await this.findOwnedById(userId, alunoId);

    if (data.turmaId) {
      await this.assertTurmaOwnership(userId, data.turmaId);
    }

    return prisma.aluno.update({
      where: {
        id: aluno.id,
      },
      data,
      include: {
        turma: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });
  }

  async softDelete(userId: string, alunoId: string) {
    const aluno = await this.findOwnedById(userId, alunoId);

    return prisma.aluno.update({
      where: { id: aluno.id },
      data: { deletedAt: new Date() },
    });
  }

  async hardDeleteExpired(cutoff: Date) {
    return prisma.aluno.deleteMany({
      where: {
        deletedAt: {
          lt: cutoff,
        },
      },
    });
  }

  async listWithoutRecentObservation(userId: string, days: number, take = 12) {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return prisma.aluno.findMany({
      where: {
        deletedAt: null,
        turma: {
          userId,
          deletedAt: null,
        },
        observacoes: {
          none: {
            createdAt: {
              gte: cutoff,
            },
          },
        },
      },
      orderBy: {
        nome: "asc",
      },
      take,
      include: {
        turma: {
          select: {
            nome: true,
          },
        },
      },
    });
  }

  async restore(userId: string, alunoId: string) {
    const aluno = await this.findOwnedById(userId, alunoId);

    return prisma.aluno.update({
      where: { id: aluno.id },
      data: { deletedAt: null },
      include: { turma: true },
    });
  }

  async listByUserPaginated(userId: string, query: { turmaId?: string; cursor?: string; limit?: number; busca?: string; lixeira?: boolean }) {
    const limit = Math.min(Math.max(query.limit ?? 80, 1), 100);
    const where = this.buildListWhere(userId, query.turmaId, query.busca);
    where.deletedAt = query.lixeira ? { not: null } : null;

    const total = await prisma.aluno.count({ where });
    const alunos = await prisma.aluno.findMany({
      where,
      orderBy: [{ nome: "asc" }, { id: "asc" }],
      take: limit + 1,
      ...(query.cursor
        ? {
            cursor: {
              id: query.cursor,
            },
            skip: 1,
          }
        : {}),
      include: {
        turma: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    const hasNext = alunos.length > limit;
    const items = alunos.slice(0, limit);

    return {
      items,
      nextCursor: hasNext ? items.at(-1)?.id ?? null : null,
      total,
    };
  }
}
