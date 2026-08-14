import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import { PROJECT_CATALOG } from "../lib/project-catalog";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não definida para o seed do Prisma.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  for (const projeto of PROJECT_CATALOG) {
    const existing = await prisma.projeto.findFirst({
      where: {
        titulo: projeto.titulo,
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      await prisma.projeto.update({
        where: {
          id: existing.id,
        },
        data: {
          descricao: projeto.descricao,
          categoria: projeto.categoria,
          faixaEtaria: projeto.faixaEtaria,
          duracao: projeto.duracao,
          thumbnailKey: projeto.coverKey,
          bnccObjetivos: projeto.bnccObjetivos,
          problema: projeto.problema,
          justificativa: projeto.justificativa,
          objetivoGeral: projeto.objetivoGeral,
          objetivosEspecificos: projeto.objetivosEspecificos,
          camposExperiencia: projeto.camposExperiencia,
          metodologia: projeto.metodologia,
          cronograma: projeto.cronograma,
          avaliacao: projeto.avaliacao,
          premium: false,
        },
      });

      for (const atividade of projeto.atividades) {
        const existingActivity = await prisma.atividade.findFirst({
          where: {
            projetoId: existing.id,
            titulo: atividade.titulo,
          },
          select: {
            id: true,
          },
        });

        if (existingActivity) {
          await prisma.atividade.update({
            where: {
              id: existingActivity.id,
            },
            data: atividade,
          });
        } else {
          await prisma.atividade.create({
            data: {
              ...atividade,
              projetoId: existing.id,
            },
          });
        }
      }

      continue;
    }

    await prisma.projeto.create({
      data: {
        titulo: projeto.titulo,
        descricao: projeto.descricao,
        categoria: projeto.categoria,
        faixaEtaria: projeto.faixaEtaria,
        duracao: projeto.duracao,
        thumbnailKey: projeto.coverKey,
        bnccObjetivos: projeto.bnccObjetivos,
        problema: projeto.problema,
        justificativa: projeto.justificativa,
        objetivoGeral: projeto.objetivoGeral,
        objetivosEspecificos: projeto.objetivosEspecificos,
        camposExperiencia: projeto.camposExperiencia,
        metodologia: projeto.metodologia,
        cronograma: projeto.cronograma,
        avaliacao: projeto.avaliacao,
        premium: false,
        atividades: {
          create: projeto.atividades,
        },
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
