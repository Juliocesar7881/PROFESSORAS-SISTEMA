"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Pencil, PlusCircle, Search, Trash2, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Turma = { id: string; nome: string };
type Aluno = { id: string; nome: string; dataNasc: string; turma: { id: string; nome: string } };

const avatarPalette = [
  "from-rose-400 to-pink-500",
  "from-violet-400 to-purple-500",
  "from-sky-400 to-cyan-500",
  "from-emerald-400 to-teal-500",
  "from-amber-400 to-orange-500",
  "from-fuchsia-400 to-pink-500",
  "from-indigo-400 to-blue-500",
];

const lightInput = "h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-800 placeholder:text-gray-300 transition-all focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100 hover:border-gray-300";
const lightSelect = "h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-800 focus:border-violet-300 focus:outline-none transition appearance-none hover:border-gray-300";
const lightLabel = "mb-1.5 block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400";

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
    const [tr, ar] = await Promise.all([fetch("/api/turmas"), fetch(alunosUrl)]);
    const tj = await tr.json();
    const aj = await ar.json();
    if (!tr.ok) { toast.error(tj.error?.message ?? "Falha"); setTurmas([]); }
    else setTurmas(tj.data ?? []);
    if (!ar.ok) { toast.error(aj.error?.message ?? "Falha"); setAlunos([]); setLoading(false); return; }
    setAlunos(aj.data ?? []);
    setLoading(false);
    if (tj.data?.length && !turmaId) setTurmaId(tj.data[0].id);
  }, [turmaId, turmaFiltro]);

  useEffect(() => { void loadData(); }, [loadData]);

  const alunosFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return q ? alunos.filter((a) => a.nome.toLowerCase().includes(q)) : alunos;
  }, [alunos, busca]);

  const calculateAge = (d: string) => {
    const b = new Date(d);
    if (Number.isNaN(b.getTime())) return "-";
    return `${Math.max(0, Math.floor((Date.now() - b.getTime()) / (365.25 * 24 * 60 * 60 * 1000)))} ano(s)`;
  };

  const getInitials = (n: string) => n.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

  const createAluno = async () => {
    if (!nome || !dataNasc || !turmaId) { toast.error("Preencha nome, data de nascimento e turma"); return; }
    const r = await fetch("/api/alunos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nome, dataNasc, turmaId }) });
    if (!r.ok) { const j = await r.json(); toast.error(j.error?.message ?? "Falha"); return; }
    setNome(""); setDataNasc(""); toast.success("Aluno adicionado"); await loadData();
  };

  const updateAluno = async (aluno: Aluno) => {
    const newName = window.prompt("Novo nome do aluno", aluno.nome)?.trim();
    if (!newName || newName === aluno.nome) return;
    const r = await fetch(`/api/alunos/${aluno.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nome: newName }) });
    const j = await r.json();
    if (!r.ok) { toast.error(j.error?.message ?? "Falha"); return; }
    toast.success("Aluno atualizado"); await loadData();
  };

  const removeAluno = async (aluno: Aluno) => {
    if (!window.confirm(`Remover ${aluno.nome} da turma?`)) return;
    const r = await fetch(`/api/alunos/${aluno.id}`, { method: "DELETE" });
    const j = await r.json();
    if (!r.ok) { toast.error(j.error?.message ?? "Falha"); return; }
    toast.success("Aluno removido"); await loadData();
  };

  return (
    <div className="space-y-5">
      {/* ─── Hero Banner ─── */}
      <div
        className="relative overflow-hidden rounded-3xl border border-amber-200/60 p-7 md:p-8"
        style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)" }}
      >
        <div className="pointer-events-none absolute -top-12 right-[-5%] h-[200px] w-[200px] rounded-full opacity-25 blur-[60px]" style={{ background: "rgba(253, 211, 77, 0.6)" }} />
        <div className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-white/90">
              <UsersRound className="size-3" />
              Gestão de Alunos
            </div>
            <h2 className="font-heading text-2xl tracking-tight text-white md:text-3xl">Minha Turma</h2>
            <p className="mt-1 text-sm text-white/70">Cadastre, acompanhe e acesse a ficha de cada aluno.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white">
              <UsersRound className="size-3" />
              {alunos.length} aluno{alunos.length !== 1 ? "s" : ""} cadastrado{alunos.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <div className="space-y-5">
        {/* Novo aluno */}
        <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="font-heading text-xl text-gray-900">Novo aluno</CardTitle>
            <CardDescription className="text-gray-500">Cadastro rápido para observação, chamada e relatório.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className={lightLabel}>Nome Completo</label>
              <input className={lightInput} placeholder="Ex: Maria Clara" value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div>
              <label className={lightLabel}>Data de Nascimento</label>
              <input className={lightInput} type="date" value={dataNasc} onChange={(e) => setDataNasc(e.target.value)} />
            </div>
            <div>
              <label className={lightLabel}>Turma</label>
              <select className={lightSelect} value={turmaId} onChange={(e) => setTurmaId(e.target.value)}>
                {turmas.map((t) => (<option key={t.id} value={t.id}>{t.nome}</option>))}
              </select>
            </div>
            <button type="button" onClick={createAluno}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white shadow-[0_4px_14px_-4px_rgba(108,92,231,0.5)] transition-all hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg, #6C5CE7 0%, #8B5CF6 100%)" }}>
              <PlusCircle className="size-4" /> Adicionar Aluno
            </button>
          </CardContent>
        </Card>

        {/* Filtros */}
        <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <CardContent className="space-y-4 p-5">
            <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Filtros da Lista</h3>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <input className={`${lightInput} pl-11`} placeholder="Buscar pelo nome…" value={busca} onChange={(e) => setBusca(e.target.value)} />
            </div>
            <select className={lightSelect} value={turmaFiltro} onChange={(e) => setTurmaFiltro(e.target.value)}>
              <option value="TODAS">Todas as turmas</option>
              {turmas.map((t) => (<option key={t.id} value={t.id}>{t.nome}</option>))}
            </select>
          </CardContent>
        </Card>
      </div>

      {/* Lista de alunos */}
      <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <CardHeader className="pb-4 border-b border-gray-100 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-heading text-xl text-gray-900">Minha Turma</CardTitle>
              <CardDescription className="text-gray-500">Toque no aluno para acessar a ficha completa.</CardDescription>
            </div>
            <div className="flex size-10 items-center justify-center rounded-2xl bg-violet-50 flex-shrink-0">
              <UsersRound className="size-5 text-[#6C5CE7]" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {!loading && alunosFiltrados.map((aluno) => {
            const grad = avatarPalette[aluno.id.length % avatarPalette.length];
            return (
              <article key={aluno.id} className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 transition-all hover:-translate-y-1 hover:shadow-md hover:border-gray-300">
                <Link href={`/dashboard/alunos/${aluno.id}`} className="relative z-10 flex items-start gap-3">
                  <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${grad} text-xs font-black text-white shadow-sm`}>
                    {getInitials(aluno.nome)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-gray-800 transition-colors group-hover:text-[#6C5CE7]">{aluno.nome}</p>
                    <p className="mt-0.5 text-xs text-gray-400">{aluno.turma.nome}</p>
                    <span className="mt-1 inline-flex rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-bold text-gray-400">
                      {calculateAge(aluno.dataNasc)}
                    </span>
                  </div>
                </Link>
                <div className="relative z-10 mt-3 flex gap-2">
                  <Button type="button" variant="ghost" onClick={() => updateAluno(aluno)}
                    className="h-8 flex-1 justify-center rounded-lg bg-gray-50 text-xs font-semibold text-gray-500 hover:bg-gray-100 hover:text-gray-700">
                    <Pencil className="mr-1.5 size-3" /> Editar
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => removeAluno(aluno)}
                    className="h-8 px-3 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-500">
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </article>
            );
          })}

          {!loading && !alunosFiltrados.length && (
            <div className="col-span-full flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 p-8 text-center">
              <UsersRound className="mb-3 size-8 text-gray-300" />
              <p className="text-sm font-semibold text-gray-500">Nenhum aluno encontrado</p>
              <p className="mt-1 text-xs text-gray-400">Tente buscar por outro nome ou filtrar por turma.</p>
            </div>
          )}

          {loading && (
            <div className="col-span-full flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 p-8">
              <div className="size-8 animate-spin rounded-full border-2 border-gray-200 border-t-violet-500" />
              <p className="mt-4 text-sm text-gray-400">Buscando turma…</p>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
