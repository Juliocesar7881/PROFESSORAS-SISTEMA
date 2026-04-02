"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Bookmark, ChevronRight, Crown, Lock, Search, Sparkles } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Projeto = {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  faixaEtaria: string;
  duracao: string;
  premium: boolean;
  premiumBloqueado?: boolean;
  atividades: Array<{ id: string; titulo: string; categoria: string; duracao: number }>;
  salvosPor?: Array<{ userId: string }>;
};

type Turma = {
  id: string;
  nome: string;
  faixaEtaria: string;
};

const categoryGradients: Record<string, string> = {
  natureza: "from-emerald-500 to-teal-500",
  corpo: "from-fuchsia-500 to-pink-500",
  linguagem: "from-amber-500 to-orange-500",
  matematica: "from-indigo-500 to-purple-500",
  sociedade: "from-cyan-500 to-blue-500",
  arte: "from-rose-500 to-purple-500",
};

function getCategoryKey(value: string) {
  return value.trim().toLowerCase();
}

export default function ProjetosPage() {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("TODAS");
  const [etapa, setEtapa] = useState("TODAS");
  const [turmaId, setTurmaId] = useState("TODAS");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTurmas = async () => {
      const response = await fetch("/api/turmas");
      const json = await response.json();
      setTurmas(json.data ?? []);
    };

    void loadTurmas();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();

    if (busca) {
      params.set("busca", busca);
    }

    if (categoria !== "TODAS") {
      params.set("categoria", categoria);
    }

    if (etapa !== "TODAS") {
      params.set("etapa", etapa);
    }

    if (turmaId !== "TODAS") {
      params.set("turmaId", turmaId);
    }

    const response = await fetch(`/api/projetos?${params.toString()}`);
    const json = await response.json();

    if (!response.ok) {
      toast.error(json.error?.message ?? "Falha ao carregar projetos");
      setProjetos([]);
      setLoading(false);
      return;
    }

    setProjetos(json.data ?? []);
    setLoading(false);
  }, [busca, categoria, etapa, turmaId]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleSave = async (projeto: Projeto) => {
    const isSaved = Boolean(projeto.salvosPor?.length);
    const response = await fetch("/api/projetos", {
      method: isSaved ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projetoId: projeto.id }),
    });

    if (!response.ok) {
      toast.error("Não foi possível atualizar projeto salvo");
      return;
    }

    toast.success(isSaved ? "Projeto removido dos salvos" : "Projeto salvo");
    await load();
  };

  const categorias = ["TODAS", ...Array.from(new Set(projetos.map((item) => item.categoria)))];

  const projetosAgrupados = useMemo(() => {
    const grouped = new Map<string, Projeto[]>();

    for (const projeto of projetos) {
      const key = projeto.categoria || "Outros";
      grouped.set(key, [...(grouped.get(key) ?? []), projeto]);
    }

    return Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [projetos]);

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-3xl text-slate-900">Biblioteca de Projetos</CardTitle>
          <CardDescription>Projetos organizados por tema, faixa etária e objetivos de aprendizagem.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-slate-400" />
            <Input className="border-slate-200 bg-slate-50 pl-9" value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Buscar por título ou descrição" />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <select
              className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700"
              value={turmaId}
              onChange={(event) => setTurmaId(event.target.value)}
            >
              <option value="TODAS">Todas as turmas</option>
              {turmas.map((turma) => (
                <option key={turma.id} value={turma.id}>
                  {turma.nome} ({turma.faixaEtaria})
                </option>
              ))}
            </select>

            <select
              className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700"
              value={etapa}
              onChange={(event) => setEtapa(event.target.value)}
            >
              <option value="TODAS">Todas as etapas</option>
              <option value="BERCARIO">Berçário</option>
              <option value="MATERNAL">Maternal</option>
              <option value="JARDIM">Jardim</option>
              <option value="PRE">Pre-escola</option>
            </select>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              {projetos.length} projeto(s) • {projetos.reduce((acc, item) => acc + item.atividades.length, 0)} atividades
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {categorias.map((item) => (
              <button
                key={item}
                type="button"
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${categoria === item ? "border-rose-200 bg-rose-50 text-rose-600" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"}`}
                onClick={() => setCategoria(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
          Carregando biblioteca de projetos...
        </div>
      )}

      {!loading && !projetosAgrupados.length && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
          Nenhum projeto encontrado para os filtros atuais.
        </div>
      )}

      {!loading &&
        projetosAgrupados.map(([categoriaNome, projetosCategoria]) => (
          <section key={categoriaNome} className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="inline-flex items-center gap-2 font-heading text-2xl text-slate-900">
                <Sparkles className="size-4 text-rose-500" />
                {categoriaNome}
              </h2>
              <span className="text-xs font-semibold text-slate-500">{projetosCategoria.length} projeto(s)</span>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2">
              {projetosCategoria.map((projeto) => {
                const saved = Boolean(projeto.salvosPor?.length);
                const gradient = categoryGradients[getCategoryKey(projeto.categoria)] ?? "from-slate-500 to-slate-400";
                const isLocked = Boolean(projeto.premium && projeto.premiumBloqueado);

                return (
                  <article
                    key={projeto.id}
                    className="relative min-w-[300px] max-w-[300px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className={`h-24 bg-gradient-to-br ${gradient} p-3`}>
                      <div className="flex items-center justify-between">
                        <p className="rounded-md bg-white/85 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-800">
                          {projeto.categoria}
                        </p>
                        {projeto.premium ? <Crown className="size-4 text-amber-200" /> : <Bookmark className="size-4 text-white/85" />}
                      </div>
                    </div>

                    <div className="space-y-2 p-4">
                      <h3 className="line-clamp-2 font-heading text-xl text-slate-900">{projeto.titulo}</h3>
                      <p className="line-clamp-2 text-sm text-slate-600">{projeto.descricao}</p>
                      <p className="text-xs text-slate-500">{projeto.faixaEtaria} • {projeto.duracao}</p>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                        <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">Atividades</p>
                        <div className="space-y-1">
                          {projeto.atividades.slice(0, 2).map((atividade) => (
                            <p key={atividade.id} className="line-clamp-1 text-xs text-slate-700">
                              • {atividade.titulo}
                            </p>
                          ))}
                          {!projeto.atividades.length && <p className="text-xs text-slate-500">Sem atividades cadastradas.</p>}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <Link href={`/dashboard/projetos/${projeto.id}`} className={buttonVariants({ className: "flex-1 bg-rose-500 text-white hover:bg-rose-600" })}>
                          Ver detalhes
                        </Link>
                        <Button
                          type="button"
                          variant="outline"
                          className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          onClick={() => toggleSave(projeto)}
                        >
                          {saved ? "Remover" : "Salvar"}
                        </Button>
                      </div>

                      <Link
                        href={`/dashboard/projetos/${projeto.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 underline"
                      >
                        Usar no planejamento
                        <ChevronRight className="size-3.5" />
                      </Link>
                    </div>

                    {isLocked && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/45 p-4 text-center backdrop-blur-[2px]">
                        <Lock className="size-5 text-white" />
                        <p className="mt-2 text-sm font-semibold text-white">Projeto premium</p>
                        <Link href="/dashboard/configuracoes" className="mt-2 text-xs font-semibold text-amber-200 underline">
                          Fazer upgrade para desbloquear
                        </Link>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        ))}
    </div>
  );
}
