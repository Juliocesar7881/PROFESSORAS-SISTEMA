import { prisma } from "@/lib/prisma";

export class AtividadeRepository {
  async search(query?: string) {
    return prisma.atividade.findMany({
      where: query
        ? {
            OR: [
              { titulo: { contains: query, mode: "insensitive" } },
              { descricao: { contains: query, mode: "insensitive" } },
              { categoria: { contains: query, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: {
        createdAt: "desc",
      },
      take: 40,
    });
  }

  async createQuick(data: {
    titulo: string;
    descricao: string;
    categoria: string;
    duracao: number;
    materiais: string[];
    bnccCodigos: string[];
  }) {
    return prisma.atividade.create({
      data,
    });
  }
}
