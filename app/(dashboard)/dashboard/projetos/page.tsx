"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Bookmark, ChevronRight, Crown, Lock, Search, Sparkles } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  natureza: "from-emerald-400 to-teal-500",
  corpo: "from-fuchsia-400 to-pink-500",
  linguagem: "from-amber-400 to-orange-500",
  matematica: "from-indigo-400 to-purple-500",
  sociedade: "from-cyan-400 to-blue-500",
  arte: "from-rose-400 to-purple-500",
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
    <div className="mx-auto max-w-6xl space-y-6">
      {/* ─── Hero Banner ─── */}
      <div
        className="relative overflow-hidden rounded-3xl border border-indigo-200/60 p-7 md:p-8"
        style={{ background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #4338ca 100%)" }}
      >
        <div className="pointer-events-none absolute -top-12 right-[-5%] h-[200px] w-[200px] rounded-full opacity-25 blur-[60px]" style={{ background: "rgba(165, 180, 252, 0.6)" }} />
        <div className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        <div className="relative z-10">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-white/90 shadow-sm backdrop-blur-md">
            <Sparkles className="size-3" />
            Biblioteca Premium
          </div>
          <h2 className="font-heading text-2xl tracking-tight text-white md:text-3xl">Biblioteca de Projetos</h2>
          <p className="mt-1 text-sm text-white/80">
            Projetos completos organizados por tema, faixa etária e objetivos de aprendizagem, prontos para uso.
          </p>
        </div>
      </div>
      
      <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <CardContent className="space-y-4 pt-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-3 size-4 text-gray-400" />
            <Input className="h-11 w-full rounded-xl border-gray-200 bg-white pl-10 text-sm font-medium text-gray-800 placeholder:text-gray-300 transition-all focus:border-violet-300 focus:ring-2 focus:ring-violet-100 hover:border-gray-300" value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Buscar por título ou descrição..." />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <select
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm font-medium text-gray-800 transition-all focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100 hover:border-gray-300 appearance-none"
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
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm font-medium text-gray-800 transition-all focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100 hover:border-gray-300 appearance-none"
              value={etapa}
              onChange={(event) => setEtapa(event.target.value)}
            >
              <option value="TODAS">Todas as etapas</option>
              <option value="BERCARIO">Berçário</option>
              <option value="MATERNAL">Maternal</option>
              <option value="JARDIM">Jardim</option>
              <option value="PRE">Pré-escola</option>
            </select>

            <div className="flex h-11 items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50 px-4 text-sm">
              <span className="font-semibold text-indigo-700">{projetos.length} projetos</span>
              <span className="text-indigo-500">•</span>
              <span className="text-indigo-600">{projetos.reduce((acc, item) => acc + item.atividades.length, 0)} atividades</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {categorias.map((item) => (
              <button
                key={item}
                type="button"
                className={`rounded-full border px-4 py-1.5 text-xs font-bold transition-all ${categoria === item ? "border-indigo-300 bg-indigo-100 text-indigo-700" : "border-gray-200 bg-white text-gray-400 hover:border-gray-300 hover:text-gray-700"}`}
                onClick={() => setCategoria(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-500">
          Carregando biblioteca de projetos...
        </div>
      )}

      {!loading && !projetosAgrupados.length && (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-5 text-sm text-gray-500">
          Nenhum projeto encontrado para os filtros atuais.
        </div>
      )}

      {!loading &&
        projetosAgrupados.map(([categoriaNome, projetosCategoria]) => (
          <section key={categoriaNome} className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="inline-flex items-center gap-2 font-heading text-2xl text-gray-900">
                <Sparkles className="size-4 text-[#6C5CE7]" />
                {categoriaNome}
              </h2>
              <span className="text-xs font-semibold text-gray-400">{projetosCategoria.length} projeto(s)</span>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2">
              {projetosCategoria.map((projeto) => {
                const saved = Boolean(projeto.salvosPor?.length);
                const gradient = categoryGradients[getCategoryKey(projeto.categoria)] ?? "from-slate-400 to-slate-500";
                const isLocked = Boolean(projeto.premium && projeto.premiumBloqueado);

                return (
                  <article
                    key={projeto.id}
                    className="relative min-w-[300px] max-w-[300px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className={`h-24 bg-gradient-to-br ${gradient} p-3`}>
                      <div className="flex items-center justify-between">
                        <p className="rounded-md bg-white/85 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-gray-800">
                          {projeto.categoria}
                        </p>
                        {projeto.premium ? <Crown className="size-4 text-amber-200" /> : <Bookmark className="size-4 text-white/85" />}
                      </div>
                    </div>

                    <div className="space-y-2 p-4">
                      <h3 className="line-clamp-2 font-heading text-xl text-gray-900">{projeto.titulo}</h3>
                      <p className="line-clamp-2 text-sm text-gray-500">{projeto.descricao}</p>
                      <p className="text-xs text-gray-400">{projeto.faixaEtaria} • {projeto.duracao}</p>

                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-2.5">
                        <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-gray-400">Atividades</p>
                        <div className="space-y-1">
                          {projeto.atividades.slice(0, 2).map((atividade) => (
                            <p key={atividade.id} className="line-clamp-1 text-xs text-gray-600">
                              • {atividade.titulo}
                            </p>
                          ))}
                          {!projeto.atividades.length && <p className="text-xs text-gray-400">Sem atividades cadastradas.</p>}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Link href={`/dashboard/projetos/${projeto.id}`} className={buttonVariants({ className: "flex-1 rounded-xl bg-[#6C5CE7] font-bold text-white shadow-[0_4px_14px_-4px_rgba(108,92,231,0.5)] transition-all hover:-translate-y-0.5 hover:bg-[#5a4bd6]" })}>
                          Ver detalhes
                        </Link>
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-xl border-gray-200 bg-white px-4 font-bold text-gray-600 transition-all hover:bg-gray-50"
                          onClick={() => toggleSave(projeto)}
                        >
                          {saved ? "Remover" : "Salvar"}
                        </Button>
                      </div>

                      <Link
                        href={`/dashboard/projetos/${projeto.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 underline"
                      >
                        Usar no planejamento
                        <ChevronRight className="size-3.5" />
                      </Link>
                    </div>

                    {isLocked && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/45 p-4 text-center backdrop-blur-[2px]">
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
