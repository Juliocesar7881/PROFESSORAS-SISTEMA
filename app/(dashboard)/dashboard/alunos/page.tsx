"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Pencil, PlusCircle, Search, Trash2, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Turma = { id: string; nome: string };
type Aluno = { id: string; nome: string; dataNasc: string; turma: { id: string; nome: string } };

const avatarPalette = [
  "from-rose-500 to-pink-500",
  "from-violet-500 to-purple-500",
  "from-sky-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
];

export default function AlunosPage() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [nome, setNome] = useState("");
  const [dataNasc, setDataNasc] = useState("");
  const [turmaId, setTurmaId] = useState("");
  const [turmaFiltro, setTurmaFiltro] = useState("TODAS");
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const alunosUrl = turmaFiltro === "TODAS" ? "/api/alunos" : `/api/alunos?turmaId=${turmaFiltro}`;
    const [turmasResponse, alunosResponse] = await Promise.all([fetch("/api/turmas"), fetch(alunosUrl)]);

    const turmasJson = await turmasResponse.json();
    const alunosJson = await alunosResponse.json();

    if (!turmasResponse.ok) {
      toast.error(turmasJson.error?.message ?? "Falha ao carregar turmas");
      setTurmas([]);
    } else {
      setTurmas(turmasJson.data ?? []);
    }

    if (!alunosResponse.ok) {
      toast.error(alunosJson.error?.message ?? "Falha ao carregar alunos");
      setAlunos([]);
      setLoading(false);
      return;
    }

    setAlunos(alunosJson.data ?? []);
    setLoading(false);

    if (turmasJson.data?.length && !turmaId) {
      setTurmaId(turmasJson.data[0].id);
    }
  }, [turmaId, turmaFiltro]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const alunosFiltrados = useMemo(() => {
    const normalized = busca.trim().toLowerCase();

    if (!normalized) {
      return alunos;
    }

    return alunos.filter((aluno) => aluno.nome.toLowerCase().includes(normalized));
  }, [alunos, busca]);

  const calculateAge = (dateValue: string) => {
    const birthDate = new Date(dateValue);

    if (Number.isNaN(birthDate.getTime())) {
      return "-";
    }

    const diff = Date.now() - birthDate.getTime();
    const years = Math.max(0, Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000)));

    return `${years} ano(s)`;
  };

  const getInitials = (fullName: string) =>
    fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();

  const createAluno = async () => {
    if (!nome || !dataNasc || !turmaId) {
      toast.error("Preencha nome, data de nascimento e turma");
      return;
    }

    const response = await fetch("/api/alunos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome,
        dataNasc,
        turmaId,
      }),
    });

    if (!response.ok) {
      const json = await response.json();
      toast.error(json.error?.message ?? "Não foi possível criar o aluno");
      return;
    }

    setNome("");
    setDataNasc("");
    toast.success("Aluno adicionado");
    await loadData();
  };

  const updateAluno = async (aluno: Aluno) => {
    const newName = window.prompt("Novo nome do aluno", aluno.nome)?.trim();

    if (!newName || newName === aluno.nome) {
      return;
    }

    const response = await fetch(`/api/alunos/${aluno.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: newName }),
    });

    const json = await response.json();

    if (!response.ok) {
      toast.error(json.error?.message ?? "Falha ao atualizar aluno");
      return;
    }

    toast.success("Aluno atualizado");
    await loadData();
  };

  const removeAluno = async (aluno: Aluno) => {
    const confirmDelete = window.confirm(`Remover ${aluno.nome} da turma?`);

    if (!confirmDelete) {
      return;
    }

    const response = await fetch(`/api/alunos/${aluno.id}`, { method: "DELETE" });
    const json = await response.json();

    if (!response.ok) {
      toast.error(json.error?.message ?? "Falha ao remover aluno");
      return;
    }

    toast.success("Aluno removido");
    await loadData();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <div className="space-y-6">
        <Card className="glass-card border-none shadow-[0_8px_30px_-20px_rgba(18,38,58,0.2)]">
          <CardHeader className="pb-4">
            <CardTitle className="font-heading text-2xl text-slate-900">Novo aluno</CardTitle>
            <CardDescription className="text-slate-500 font-medium">Cadastro rápido para observação, chamada e relatório.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Nome Completo</label>
                <Input className="h-11 rounded-xl border-slate-200/60 bg-slate-50/50 px-4 transition-colors focus:bg-white focus:ring-2 focus:ring-rose-500/20" placeholder="Ex: Maria Clara" value={nome} onChange={(event) => setNome(event.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Data de Nascimento</label>
                <Input className="h-11 rounded-xl border-slate-200/60 bg-slate-50/50 px-4 transition-colors focus:bg-white focus:ring-2 focus:ring-rose-500/20" type="date" value={dataNasc} onChange={(event) => setDataNasc(event.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Turma</label>
                <select
                  className="h-11 w-full rounded-xl border border-slate-200/60 bg-slate-50/50 px-4 text-sm font-medium text-slate-800 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  value={turmaId}
                  onChange={(event) => setTurmaId(event.target.value)}
                >
                  {turmas.map((turma) => (
                    <option key={turma.id} value={turma.id}>
                      {turma.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <Button onClick={createAluno} className="h-11 w-full rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 font-bold text-white shadow-[0_8px_16px_-8px_rgba(244,63,94,0.5)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_20px_-8px_rgba(244,63,94,0.6)]">
              <PlusCircle className="mr-2 size-4.5" />
              Adicionar Aluno
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-[0_8px_30px_-20px_rgba(18,38,58,0.2)]">
          <CardContent className="p-5 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.15em] text-slate-400">Filtros da Lista</h3>
            <div className="space-y-3">
              <div className="relative group">
                <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-slate-400 transition-colors group-focus-within:text-rose-500" />
                <Input
                  className="h-11 rounded-xl border-slate-200/60 bg-white pl-11 shadow-sm transition-all focus:ring-2 focus:ring-rose-500/20"
                  placeholder="Buscar pelo nome..."
                  value={busca}
                  onChange={(event) => setBusca(event.target.value)}
                />
              </div>
              <select
                className="h-11 w-full rounded-xl border border-slate-200/60 bg-white px-4 text-sm font-medium text-slate-800 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                value={turmaFiltro}
                onChange={(event) => setTurmaFiltro(event.target.value)}
              >
                <option value="TODAS">Todas as turmas</option>
                {turmas.map((turma) => (
                  <option key={turma.id} value={turma.id}>
                    {turma.nome}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card border-none shadow-[0_8px_30px_-20px_rgba(18,38,58,0.2)]">
        <CardHeader className="pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-heading text-2xl text-slate-900">Minha Turma</CardTitle>
              <CardDescription className="text-slate-500 font-medium">Toque no aluno para acessar a ficha completa e registrar observações.</CardDescription>
            </div>
            <div className="flex size-10 items-center justify-center rounded-2xl bg-rose-50 ring-1 ring-rose-100 flex-shrink-0">
              <UsersRound className="size-5 text-rose-500" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {!loading &&
            alunosFiltrados.map((aluno) => {
              const paletteIndex = aluno.id.length % avatarPalette.length;
              const StringGradient = avatarPalette[paletteIndex];

              return (
                <article key={aluno.id} className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
                  <div className="absolute top-0 right-0 h-24 w-24 -translate-y-8 translate-x-8 rounded-full bg-slate-50 opacity-0 transition-opacity group-hover:opacity-100" />
                  
                  <Link href={`/dashboard/alunos/${aluno.id}`} className="relative z-10 flex items-start gap-4">
                    <div className={`flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-sm font-black text-white shadow-inner ${StringGradient}`}>
                      {getInitials(aluno.nome)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-bold text-slate-900 group-hover:text-rose-600 transition-colors">{aluno.nome}</p>
                      <p className="mt-0.5 text-xs font-semibold text-slate-500">{aluno.turma.nome}</p>
                      <p className="mt-1 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                        {calculateAge(aluno.dataNasc)}
                      </p>
                    </div>
                  </Link>

                  <div className="relative z-10 mt-4 flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-9 flex-1 justify-center rounded-xl bg-slate-50/80 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                      onClick={() => updateAluno(aluno)}
                    >
                      <Pencil className="mr-2 size-3.5" />
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-9 px-3 justify-center rounded-xl bg-rose-50/50 text-rose-600 transition-colors hover:bg-rose-100 hover:text-rose-700"
                      onClick={() => removeAluno(aluno)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </article>
              );
            })}

          {!loading && !alunosFiltrados.length && (
            <div className="col-span-full flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center">
              <UsersRound className="mb-3 size-8 text-slate-300" />
              <p className="text-base font-semibold text-slate-900">Nenhum aluno encontrado</p>
              <p className="mt-1 text-sm text-slate-500">Tente buscar por outro nome ou mudar a turma filtrada.</p>
            </div>
          )}

          {loading && (
            <div className="col-span-full flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8">
               <div className="size-8 animate-spin rounded-full border-4 border-slate-200 border-t-rose-500" />
               <p className="mt-4 text-sm font-semibold text-slate-500">Buscando turma...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
