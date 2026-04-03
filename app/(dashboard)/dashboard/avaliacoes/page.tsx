"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Bot, Camera, FileText, Loader2, Search, Sparkles, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type Turma = { id: string; nome: string; faixaEtaria: string };
type Aluno = { id: string; nome: string; turma: { id: string; nome: string } };
type Observacao = { id: string; texto: string; categoria: "APRENDIZAGEM" | "LINGUAGEM" | "SOCIAL" | "MOTOR" | "CRIATIVIDADE"; createdAt: string };
type Relatorio = { id: string; texto: string; periodo: string; createdAt: string };

const categoriaOptions: Array<{ value: Observacao["categoria"]; label: string; color: string }> = [
  { value: "APRENDIZAGEM", label: "Aprendizagem", color: "border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100" },
  { value: "LINGUAGEM",    label: "Linguagem",    color: "border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100" },
  { value: "SOCIAL",       label: "Social",       color: "border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100" },
  { value: "MOTOR",        label: "Motor",        color: "border-pink-200 bg-pink-50 text-pink-600 hover:bg-pink-100" },
  { value: "CRIATIVIDADE", label: "Criatividade", color: "border-purple-200 bg-purple-50 text-purple-600 hover:bg-purple-100" },
];

const quickTemplates = [
  "Participou com interesse da proposta e concluiu a atividade com apoio leve.",
  "Demonstrou avanço na interação com colegas durante a atividade em grupo.",
  "Precisou de mediação para manter foco, mas respondeu bem aos combinados.",
  "Expressou ideias com autonomia e ampliou vocabulário durante a conversa.",
];

const lightSelect = "h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm font-medium text-gray-800 transition-all focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100 hover:border-gray-300 appearance-none";
const lightInput  = "h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm font-medium text-gray-800 placeholder:text-gray-300 transition-all focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100 hover:border-gray-300";

export default function AvaliacoesPage() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [observacoes, setObservacoes] = useState<Observacao[]>([]);
  const [relatorios, setRelatorios] = useState<Relatorio[]>([]);
  const [searchAluno, setSearchAluno] = useState("");
  const [selectedTurma, setSelectedTurma] = useState("");
  const [selectedAlunoId, setSelectedAlunoId] = useState("");
  const [categoria, setCategoria] = useState<Observacao["categoria"]>("APRENDIZAGEM");
  const [texto, setTexto] = useState("");
  const [periodo, setPeriodo] = useState("Bimestre atual");
  const [foto, setFoto] = useState<File | null>(null);
  const [loadingTurmas, setLoadingTurmas] = useState(true);
  const [loadingAlunos, setLoadingAlunos] = useState(false);
  const [loadingContext, setLoadingContext] = useState(false);
  const [savingObservation, setSavingObservation] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  const fotoPreview = useMemo(() => (foto ? URL.createObjectURL(foto) : null), [foto]);
  useEffect(() => () => { if (fotoPreview) URL.revokeObjectURL(fotoPreview); }, [fotoPreview]);

  const loadTurmas = useCallback(async () => {
    setLoadingTurmas(true);
    try {
      const r = await fetch("/api/turmas");
      const j = await r.json();
      if (!r.ok) throw new Error(j.error?.message ?? "Falha");
      const data = (j.data ?? []) as Turma[];
      setTurmas(data);
      if (data.length) setSelectedTurma((c) => c || data[0].id);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Falha"); setTurmas([]); }
    finally { setLoadingTurmas(false); }
  }, []);

  const loadAlunos = useCallback(async (turmaId: string) => {
    setLoadingAlunos(true);
    try {
      const r = await fetch(`/api/alunos?${new URLSearchParams({ turmaId })}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error?.message ?? "Falha");
      const data = (j.data ?? []) as Aluno[];
      setAlunos(data);
      setSelectedAlunoId((c) => (c && data.some((a) => a.id === c) ? c : data[0]?.id ?? ""));
    } catch (e) { toast.error(e instanceof Error ? e.message : "Falha"); setAlunos([]); setSelectedAlunoId(""); }
    finally { setLoadingAlunos(false); }
  }, []);

  const loadAlunoContext = useCallback(async (alunoId: string) => {
    setLoadingContext(true);
    try {
      const [ro, rr] = await Promise.all([fetch(`/api/observacoes?alunoId=${alunoId}`), fetch(`/api/relatorios?alunoId=${alunoId}`)]);
      const [jo, jr] = await Promise.all([ro.json(), rr.json()]);
      if (!ro.ok) throw new Error(jo.error?.message ?? "Falha");
      if (!rr.ok) throw new Error(jr.error?.message ?? "Falha");
      setObservacoes(jo.data ?? []);
      setRelatorios(jr.data ?? []);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Falha"); setObservacoes([]); setRelatorios([]); }
    finally { setLoadingContext(false); }
  }, []);

  useEffect(() => { void loadTurmas(); }, [loadTurmas]);
  useEffect(() => { if (!selectedTurma) return; void loadAlunos(selectedTurma); }, [selectedTurma, loadAlunos]);
  useEffect(() => { if (!selectedAlunoId) { setObservacoes([]); setRelatorios([]); return; } void loadAlunoContext(selectedAlunoId); }, [selectedAlunoId, loadAlunoContext]);

  const selectedAluno = useMemo(() => alunos.find((a) => a.id === selectedAlunoId) ?? null, [alunos, selectedAlunoId]);
  const filteredAlunos = useMemo(() => {
    const q = searchAluno.trim().toLowerCase();
    return q ? alunos.filter((a) => a.nome.toLowerCase().includes(q)) : alunos;
  }, [alunos, searchAluno]);

  const handleSaveObservation = async () => {
    if (!selectedAlunoId) { toast.error("Selecione um aluno"); return; }
    if (!texto.trim()) { toast.error("Escreva uma observação antes de salvar"); return; }
    setSavingObservation(true);
    try {
      const formData = new FormData();
      formData.append("texto", texto);
      formData.append("categoria", categoria);
      formData.append("alunoId", selectedAlunoId);
      if (foto) formData.append("foto", foto);
      const r = await fetch("/api/observacoes", { method: "POST", body: formData });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error?.message ?? "Falha");
      setTexto(""); setFoto(null);
      toast.success("Avaliação registrada");
      await loadAlunoContext(selectedAlunoId);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Falha"); }
    finally { setSavingObservation(false); }
  };

  const handleGenerateReport = async () => {
    if (!selectedAlunoId) { toast.error("Selecione um aluno"); return; }
    if (observacoes.length < 5) { toast.error("São necessárias ao menos 5 observações"); return; }
    setGeneratingReport(true);
    try {
      const r = await fetch("/api/relatorios", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ alunoId: selectedAlunoId, periodo }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error?.message ?? "Falha");
      toast.success("Relatório gerado");
      await loadAlunoContext(selectedAlunoId);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Falha"); }
    finally { setGeneratingReport(false); }
  };

  const obsProgress = Math.min(observacoes.length, 5);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* ─── Hero Banner ─── */}
      <div
        className="relative overflow-hidden rounded-3xl border border-emerald-200/60 p-7 md:p-8"
        style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)" }}
      >
        <div className="pointer-events-none absolute -top-12 right-[-5%] h-[200px] w-[200px] rounded-full opacity-25 blur-[60px]" style={{ background: "rgba(167, 243, 208, 0.6)" }} />
        <div className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        <div className="relative z-10">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-white/90 shadow-sm backdrop-blur-md">
            <Sparkles className="size-3" />
            Avaliação Contínua
          </div>
          <h2 className="font-heading text-2xl tracking-tight text-white md:text-3xl">Registros e Relatórios com IA</h2>
          <p className="mt-1 text-sm text-white/80">
            Acompanhe o desenvolvimento individual, registre observações categorizadas e gere relatórios automáticos.
          </p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[320px_1fr]">
        {/* Painel de alunos */}
        <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-xl text-gray-900">Turma e alunos</CardTitle>
            <CardDescription className="text-gray-500">Selecione quem será avaliado hoje.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <select value={selectedTurma} onChange={(e) => setSelectedTurma(e.target.value)} className={lightSelect} disabled={loadingTurmas || !turmas.length}>
              {!turmas.length && <option value="">Sem turmas cadastradas</option>}
              {turmas.map((t) => (<option key={t.id} value={t.id}>{t.nome} ({t.faixaEtaria})</option>))}
            </select>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-gray-400" />
              <input className={`${lightInput} pl-9`} placeholder="Buscar aluno…" value={searchAluno} onChange={(e) => setSearchAluno(e.target.value)} />
            </div>

            <div className="max-h-[580px] space-y-2 overflow-y-auto pr-1 scrollbar-hide">
              {(loadingTurmas || loadingAlunos) && (
                <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-500">
                  <Loader2 className="size-4 animate-spin text-[#6C5CE7]" /> Carregando alunos…
                </div>
              )}
              {!loadingTurmas && !loadingAlunos && filteredAlunos.map((aluno) => (
                <button key={aluno.id} type="button" onClick={() => setSelectedAlunoId(aluno.id)}
                  className={`w-full rounded-xl border p-3 text-left transition-all ${selectedAlunoId === aluno.id ? "border-[#6C5CE7]/30 bg-violet-50" : "border-gray-200 bg-gray-50/50 hover:border-gray-300 hover:shadow-sm"}`}>
                  <p className={`font-semibold ${selectedAlunoId === aluno.id ? "text-[#6C5CE7]" : "text-gray-800"}`}>{aluno.nome}</p>
                  <p className="text-xs text-gray-400">{aluno.turma.nome}</p>
                </button>
              ))}
              {!loadingTurmas && !loadingAlunos && !filteredAlunos.length && (
                <p className="rounded-xl border border-dashed border-gray-300 p-3 text-sm text-gray-400">
                  {alunos.length ? "Nenhum aluno encontrado." : "Turma sem alunos cadastrados."}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Avaliação + histórico */}
        <div className="space-y-5">
          <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="font-heading text-xl text-gray-900">Registro de avaliação</CardTitle>
              <CardDescription className="text-gray-500">Use os modelos abaixo para agilizar o preenchimento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedAluno && (
                <div className="rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-400">
                  Selecione um aluno para iniciar a avaliação.
                </div>
              )}

              {selectedAluno && (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="rounded-full bg-[#6C5CE7] text-white">{selectedAluno.nome}</Badge>
                    <Badge variant="outline" className="rounded-full border-gray-200 text-gray-500">{selectedAluno.turma.nome}</Badge>
                    <Badge variant="outline" className="rounded-full border-gray-200 text-gray-500">{observacoes.length} obs.</Badge>
                    <Badge variant="outline" className="rounded-full border-gray-200 text-gray-500">{relatorios.length} rel.</Badge>
                    <Link href={`/dashboard/alunos/${selectedAluno.id}`} className="text-xs font-semibold text-emerald-600 underline underline-offset-2 hover:text-emerald-500 transition-colors">
                      Abrir ficha completa →
                    </Link>
                  </div>

                  <div>
                    <p className="mb-2 px-1 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Modelos rápidos</p>
                    <div className="grid gap-2 md:grid-cols-2">
                      {quickTemplates.map((template) => (
                        <button key={template} type="button" onClick={() => setTexto(template)}
                          className="rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-left text-xs text-gray-500 transition hover:border-emerald-200 hover:bg-emerald-50/60 hover:text-emerald-600">
                          {template}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 px-1 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Categoria da observação</p>
                    <div className="flex flex-wrap gap-2">
                      {categoriaOptions.map((item) => (
                        <button key={item.value} type="button" onClick={() => setCategoria(item.value)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${categoria === item.value ? item.color + " ring-1 ring-offset-0" : "border-gray-200 bg-white text-gray-400 hover:text-gray-600"}`}>
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Textarea value={texto} onChange={(e) => setTexto(e.target.value)}
                    placeholder="Descreva o que foi observado hoje…"
                    className="min-h-[140px] rounded-xl border border-gray-200 bg-white text-gray-800 placeholder:text-gray-300 transition-all focus:border-violet-300 focus:ring-violet-100 focus-visible:ring-2 hover:border-gray-300" />

                  <input type="file" accept="image/*" capture="environment" onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
                    className="block w-full rounded-xl border border-gray-200 bg-[#F1F3F9] px-3 py-2 text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-violet-50 file:px-3 file:py-1 file:text-xs file:font-bold file:text-[#6C5CE7] hover:file:bg-violet-100" />

                  {fotoPreview && (
                    <a href={fotoPreview} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-gray-200">
                      <Image src={fotoPreview} alt="Pré-visualização" width={960} height={640} unoptimized className="h-40 w-full object-cover" />
                    </a>
                  )}

                  <button type="button" onClick={handleSaveObservation} disabled={savingObservation}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl px-6 text-sm font-bold text-white shadow-[0_4px_14px_-4px_rgba(16,185,129,0.5)] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}>
                    {savingObservation ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
                    {savingObservation ? "Salvando…" : "Salvar avaliação"}
                  </button>
                </>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* IA */}
            <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="font-heading text-lg text-gray-900">Relatório por IA</CardTitle>
                <CardDescription className="text-gray-500">Disponível a partir de 5 observações.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <input value={periodo} onChange={(e) => setPeriodo(e.target.value)} placeholder="Período" className={lightInput} />

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Progresso para relatório</span>
                    <span className={obsProgress >= 5 ? "text-emerald-600 font-bold" : "text-gray-400"}>{obsProgress}/5</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gray-100">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#a78bfa] transition-all" style={{ width: `${(obsProgress / 5) * 100}%` }} />
                  </div>
                </div>

                <button type="button" onClick={handleGenerateReport} disabled={generatingReport || observacoes.length < 5 || !selectedAluno}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl px-6 text-sm font-bold text-white shadow-[0_4px_14px_-4px_rgba(108,92,231,0.5)] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #6C5CE7 0%, #8B5CF6 100%)" }}>
                  {generatingReport ? <Loader2 className="size-4 animate-spin" /> : <Bot className="size-4" />}
                  {generatingReport ? "Gerando…" : "Gerar relatório"}
                </button>

                <div className="space-y-2">
                  {(loadingContext ? [] : relatorios.slice(0, 2)).map((r) => (
                    <article key={r.id} className="rounded-xl border border-gray-200 bg-gray-50/50 p-3">
                      <p className="text-xs font-semibold text-gray-400">{r.periodo}</p>
                      <p className="mt-1 line-clamp-4 text-sm text-gray-700">{r.texto}</p>
                    </article>
                  ))}
                  {!loadingContext && !relatorios.length && (
                    <p className="rounded-xl border border-dashed border-gray-300 p-3 text-sm text-gray-400">Nenhum relatório gerado.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Histórico */}
            <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="font-heading text-lg text-gray-900">Últimas observações</CardTitle>
                <CardDescription className="text-gray-500">Histórico rápido do aluno.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {loadingContext && (
                  <div className="flex items-center gap-2 p-3 text-sm text-gray-500">
                    <Loader2 className="size-4 animate-spin text-[#6C5CE7]" /> Carregando…
                  </div>
                )}
                {!loadingContext && observacoes.slice(0, 6).map((o) => (
                  <article key={o.id} className="rounded-xl border border-gray-200 bg-gray-50/50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-gray-400">{new Date(o.createdAt).toLocaleDateString("pt-BR")}</p>
                      <span className={`obs-${o.categoria.toLowerCase()} rounded-full px-2.5 py-0.5 text-[10px] font-bold`}>{o.categoria}</span>
                    </div>
                    <p className="mt-1 line-clamp-3 text-sm text-gray-600">{o.texto}</p>
                  </article>
                ))}
                {!loadingContext && !observacoes.length && (
                  <p className="rounded-xl border border-dashed border-gray-300 p-3 text-sm text-gray-400">Ainda não há observações.</p>
                )}
                {!!selectedAluno && (
                  <Link href={`/dashboard/alunos/${selectedAluno.id}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 underline underline-offset-2 hover:text-emerald-500 transition-colors">
                    <UserRound className="size-3.5" /> Abrir perfil completo
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer info */}
      <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <CardContent className="flex flex-wrap items-center gap-2 py-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
            <Sparkles className="size-3.5" /> Linguagem simples para uso no dia a dia
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-600">
            <FileText className="size-3.5" /> Registros salvos no histórico do aluno
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
