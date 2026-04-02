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

    this.assertFound(turma, "Turma nao encontrada");
  }

  async listByUser(userId: string, turmaId?: string) {
    const where: Prisma.AlunoWhereInput = {
      deletedAt: null,
      turma: {
        userId,
        deletedAt: null,
      },
    };

    if (turmaId) {
      where.turmaId = turmaId;
    }

    return prisma.aluno.findMany({
      where,
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
        dataNasc: data.dataNasc,
        turmaId: data.turmaId,
      },
    });
  }

  async findOwnedById(userId: string, alunoId: string) {
    const aluno = await prisma.aluno.findFirst({
      where: {
        id: alunoId,
        turma: {
          userId,
        },
      },
      include: {
        turma: true,
      },
    });

    return this.assertFound(aluno, "Aluno nao encontrado");
  }

  async update(userId: string, alunoId: string, data: UpdateAlunoInput) {
    const aluno = await this.findOwnedById(userId, alunoId);

    return prisma.aluno.update({
      where: {
        id: aluno.id,
      },
      data,
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

  async listWithoutRecentObservation(userId: string, days: number) {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const alunos = await prisma.aluno.findMany({
      where: {
        deletedAt: null,
        turma: {
          userId,
          deletedAt: null,
        },
      },
      include: {
        observacoes: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          select: {
            createdAt: true,
          },
        },
        turma: {
          select: {
            nome: true,
          },
        },
      },
    });

    return alunos.filter((aluno) => {
      const last = aluno.observacoes[0]?.createdAt;
      return !last || last < cutoff;
    });
  }
}
