import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const projetos = [
    {
      titulo: "Jardim Sensorial",
      descricao: "Projeto para explorar texturas, cheiros e cores da natureza em atividades colaborativas.",
      categoria: "Natureza",
      faixaEtaria: "4-5 anos",
      duracao: "4 semanas",
      bnccObjetivos: ["Explorar diferentes materiais", "Desenvolver linguagem descritiva"],
      premium: false,
      atividades: [
        {
          titulo: "Caixa de texturas",
          descricao: "Criancas identificam elementos naturais pelo toque.",
          categoria: "Natureza",
          duracao: 35,
          materiais: ["folhas", "areia", "pedras lisas"],
          bnccCodigos: ["EI03CG03"],
        },
        {
          titulo: "Mural das descobertas",
          descricao: "Registro coletivo das observacoes da turma.",
          categoria: "Linguagem",
          duracao: 40,
          materiais: ["cartolina", "canetinhas", "cola"],
          bnccCodigos: ["EI03EF01"],
        },
      ],
    },
    {
      titulo: "Atelie de Arte em Movimento",
      descricao: "Projeto para integrar expressao corporal, musica e artes visuais.",
      categoria: "Arte",
      faixaEtaria: "5-6 anos",
      duracao: "5 semanas",
      bnccObjetivos: ["Expressar-se corporalmente", "Criar producoes artisticas"],
      premium: true,
      atividades: [
        {
          titulo: "Pintura ao som de ritmos",
          descricao: "Pintura coletiva guiada por estilos musicais distintos.",
          categoria: "Arte",
          duracao: 45,
          materiais: ["tinta guache", "papel kraft", "caixas de som"],
          bnccCodigos: ["EI03TS02"],
        },
        {
          titulo: "Esculturas com reciclaveis",
          descricao: "Construcoes criativas com materiais do cotidiano.",
          categoria: "Criatividade",
          duracao: 50,
          materiais: ["papelao", "rolos", "fitas"],
          bnccCodigos: ["EI03CG05"],
        },
      ],
    },
    {
      titulo: "Numeros na Rotina",
      descricao: "Projeto para explorar matematica em contextos reais da sala de aula.",
      categoria: "Matematica",
      faixaEtaria: "4-6 anos",
      duracao: "3 semanas",
      bnccObjetivos: ["Reconhecer quantidades", "Comparar grandezas"],
      premium: false,
      atividades: [
        {
          titulo: "Mercadinho da turma",
          descricao: "Simulacao de compras com contagem de itens.",
          categoria: "Matematica",
          duracao: 30,
          materiais: ["embalagens", "fichas de preco"],
          bnccCodigos: ["EI03ET07"],
        },
        {
          titulo: "Calendario das presencas",
          descricao: "Leitura de dados de presenca para analisar frequencia.",
          categoria: "Matematica",
          duracao: 25,
          materiais: ["quadro", "adesivos"],
          bnccCodigos: ["EI03ET05"],
        },
      ],
    },
  ];

  for (const projeto of projetos) {
    const existing = await prisma.projeto.findFirst({
      where: {
        titulo: projeto.titulo,
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      continue;
    }

    await prisma.projeto.create({
      data: {
        titulo: projeto.titulo,
        descricao: projeto.descricao,
        categoria: projeto.categoria,
        faixaEtaria: projeto.faixaEtaria,
        duracao: projeto.duracao,
        bnccObjetivos: projeto.bnccObjetivos,
        premium: projeto.premium,
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
