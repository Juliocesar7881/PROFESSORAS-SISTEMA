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
    return <p className="text-slate-500">Carregando projeto...</p>;
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card border-none shadow-[0_8px_30px_-20px_rgba(18,38,58,0.2)]">
        <CardHeader>
          <CardTitle className="font-heading text-3xl text-slate-900">{projeto.titulo}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-slate-700">
          <p>{projeto.descricao}</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-700">{projeto.categoria}</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-700">{projeto.faixaEtaria}</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-700">{projeto.duracao}</span>
            {projeto.premium && <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-semibold text-amber-700">Projeto premium</span>}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="mb-1 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Target className="size-4 text-emerald-600" />
              Objetivos BNCC
            </p>
            <ul className="space-y-1 text-sm text-slate-700">
              {projeto.bnccObjetivos.map((objetivo) => (
                <li key={objetivo}>• {objetivo}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-none shadow-[0_8px_30px_-20px_rgba(18,38,58,0.2)]">
        <CardHeader>
          <CardTitle className="font-heading text-2xl text-slate-900">Sequência de atividades</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {projeto.atividades.map((atividade) => (
            <article key={atividade.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-lg font-semibold text-slate-900">{atividade.titulo}</p>
              <p className="text-sm text-slate-700">{atividade.descricao}</p>
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500">
                <Timer className="size-3.5" />
                {atividade.categoria} • {atividade.duracao} min
              </p>
              <p className="mt-2 text-xs text-slate-700">
                <span className="font-semibold text-slate-900">Materiais:</span> {atividade.materiais.join(", ") || "Sem materiais"}
              </p>
              <p className="text-xs text-slate-700">
                <span className="font-semibold text-slate-900">BNCC:</span> {atividade.bnccCodigos.join(", ") || "Sem códigos"}
              </p>
            </article>
          ))}

          {!projeto.atividades.length && <p className="text-slate-500">Projeto sem atividades cadastradas.</p>}
        </CardContent>
      </Card>

      <Link
        href="/dashboard/planejamento"
        className={buttonVariants({ className: "bg-gradient-to-r from-rose-500 to-purple-600 text-white hover:from-rose-600 hover:to-purple-700" })}
      >
        <BookOpenText className="mr-2 size-4" />
        Usar no planejamento da semana
      </Link>
    </div>
  );
}
