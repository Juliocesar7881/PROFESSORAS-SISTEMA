"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BookOpenText, Target, Timer } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Atividade = { id: string; titulo: string; descricao: string; categoria: string; duracao: number; materiais: string[]; bnccCodigos: string[] };

type Projeto = {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  faixaEtaria: string;
  duracao: string;
  bnccObjetivos: string[];
  atividades: Atividade[];
  premium: boolean;
};

export default function ProjetoDetailPage({ params }: { params: { id: string } }) {
  const [projeto, setProjeto] = useState<Projeto | null>(null);

  useEffect(() => {
    const load = async () => {
      const response = await fetch(`/api/projetos/${params.id}`);
      const json = await response.json();

      if (!response.ok) {
        toast.error(json.error?.message ?? "Falha ao carregar projeto");
        return;
      }

      setProjeto(json.data);
    };

    void load();
  }, [params.id]);

  if (!projeto) {
    return <p className="text-[#6A638D]">Carregando projeto...</p>;
  }

  return (
    <div className="space-y-4">
      <Card className="glass-card border-[#DCECF8]">
        <CardHeader>
          <CardTitle className="font-heading text-3xl text-[#1E1740]">{projeto.titulo}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-[#4E4770]">
          <p>{projeto.descricao}</p>
          <div className="flex flex-wrap gap-2 text-xs text-[#6A638D]">
            <span className="inline-flex items-center gap-1 rounded-full border border-[#D8E9F8] bg-white px-2 py-1">{projeto.categoria}</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-[#D8E9F8] bg-white px-2 py-1">{projeto.faixaEtaria}</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-[#D8E9F8] bg-white px-2 py-1">{projeto.duracao}</span>
            {projeto.premium && <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-amber-700">Projeto premium</span>}
          </div>

          <div className="rounded-xl border border-[#DCECF8] bg-[#F8FBFF] p-3">
            <p className="mb-1 inline-flex items-center gap-2 text-sm font-semibold text-[#1E1740]">
              <Target className="size-4 text-[#0BB8A8]" />
              Objetivos BNCC
            </p>
            <ul className="space-y-1 text-sm text-[#5C5582]">
              {projeto.bnccObjetivos.map((objetivo) => (
                <li key={objetivo}>• {objetivo}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-[#DCECF8]">
        <CardHeader>
          <CardTitle className="font-heading text-2xl text-[#1E1740]">Sequência de atividades</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {projeto.atividades.map((atividade) => (
            <article key={atividade.id} className="rounded-xl border border-[#DCECF8] bg-[#F8FBFF] p-3">
              <p className="text-lg font-semibold text-[#1E1740]">{atividade.titulo}</p>
              <p className="text-sm text-[#5C5582]">{atividade.descricao}</p>
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-[#7A739E]">
                <Timer className="size-3.5" />
                {atividade.categoria} • {atividade.duracao} min
              </p>
              <p className="mt-2 text-xs text-[#5C5582]">
                <span className="font-semibold text-[#1E1740]">Materiais:</span> {atividade.materiais.join(", ") || "Sem materiais"}
              </p>
              <p className="text-xs text-[#5C5582]">
                <span className="font-semibold text-[#1E1740]">BNCC:</span> {atividade.bnccCodigos.join(", ") || "Sem códigos"}
              </p>
            </article>
          ))}

          {!projeto.atividades.length && <p className="text-[#6A638D]">Projeto sem atividades cadastradas.</p>}
        </CardContent>
      </Card>

      <Link href="/dashboard/planejamento" className={buttonVariants({ className: "bg-[#0BB8A8] text-white hover:bg-[#0A9F92]" })}>
        <BookOpenText className="mr-2 size-4" />
        Usar no planejamento da semana
      </Link>
    </div>
  );
}
