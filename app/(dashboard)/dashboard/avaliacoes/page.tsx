"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Bot, Camera, FileText, Loader2, Search, Sparkles, Trash2, UserRound } from "lucide-react";

import { DashboardPageHero } from "@/components/dashboard-page-hero";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type Turma = { id: string; nome: string; faixaEtaria: string };
type Aluno = { id: string; nome: string; turma: { id: string; nome: string } };
type Observacao = {
  id: string;
  texto: string;
  categoria: "APRENDIZAGEM" | "LINGUAGEM" | "SOCIAL" | "MOTOR" | "CRIATIVIDADE";
  createdAt: string;
  fotos: Array<{ id: string; url: string | null }>;
};
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

/* Using global pf-select and pf-input classes */

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
  const [deletingObservacaoId, setDeletingObservacaoId] = useState<string | null>(null);
  const [deletingRelatorioId, setDeletingRelatorioId] = useState<string | null>(null);

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
      const j = (await r.json()) as {
        data?: {
          upload?: {
            uploadedCount?: number;
            failedCount?: number;
            message?: string;
          };
        };
        error?: { message?: string };
      };
      if (!r.ok) throw new Error(j.error?.message ?? "Falha");
      setTexto(""); setFoto(null);

      const upload = j.data?.upload;
      const failedCount = upload?.failedCount ?? 0;

      if (failedCount > 0) {
        toast.warning(upload?.message ?? "Avaliação salva, mas houve falha no envio de imagem.");
      } else {
        toast.success(upload?.message ?? "Avaliação registrada");
      }

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

  const handleDeleteObservation = async (observacaoId: string) => {
    if (!window.confirm("Deseja excluir esta observação? Esta ação não pode ser desfeita.")) {
      return;
    }

    setDeletingObservacaoId(observacaoId);
    try {
      const r = await fetch(`/api/observacoes/${observacaoId}`, { method: "DELETE" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error?.message ?? "Falha ao excluir observação");
      setObservacoes((current) => current.filter((item) => item.id !== observacaoId));
      toast.success("Observação excluída");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha");
    } finally {
      setDeletingObservacaoId(null);
    }
  };

  const handleDeleteReport = async (relatorioId: string) => {
    if (!window.confirm("Deseja excluir este relatório? Esta ação não pode ser desfeita.")) {
      return;
    }

    setDeletingRelatorioId(relatorioId);
    try {
      const r = await fetch(`/api/relatorios/${relatorioId}`, { method: "DELETE" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error?.message ?? "Falha ao excluir relatório");
      setRelatorios((current) => current.filter((item) => item.id !== relatorioId));
      toast.success("Relatório excluído");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha");
    } finally {
      setDeletingRelatorioId(null);
    }
  };

  const obsProgress = Math.min(observacoes.length, 5);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <DashboardPageHero
        icon={Sparkles}
        badge="Avaliação Contínua"
        title="Registros e Relatórios com IA"
        description="Acompanhe o desenvolvimento individual, registre observações categorizadas e gere relatórios automáticos."
        gradient="linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)"
        orbColor="rgba(167, 243, 208, 0.6)"
        borderClassName="border-emerald-200/60"
      />

      <div className="grid gap-5 xl:grid-cols-[320px_1fr]">
        {/* Painel de alunos */}
        <Card className="pf-card rounded-[1.4rem] border-sky-100/80 bg-white">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="font-heading text-lg text-[#223246]">Turma e alunos</CardTitle>
            <CardDescription className="text-[13px] font-semibold text-[#6f88a2]">Selecione quem será avaliado hoje.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-5 pt-0">
            <select value={selectedTurma} onChange={(e) => setSelectedTurma(e.target.value)} className="pf-select" disabled={loadingTurmas || !turmas.length}>
              {!turmas.length && <option value="">Sem turmas cadastradas</option>}
              {turmas.map((t) => (<option key={t.id} value={t.id}>{t.nome} ({t.faixaEtaria})</option>))}
            </select>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-3 size-4 text-[#8aa2b9]" />
              <input className="pf-input pl-10" placeholder="Buscar aluno…" value={searchAluno} onChange={(e) => setSearchAluno(e.target.value)} />
            </div>

            <div className="max-h-[580px] space-y-2 overflow-y-auto pr-1 scrollbar-hide">
              {(loadingTurmas || loadingAlunos) && (
                <div className="flex items-center gap-2.5 rounded-2xl border border-sky-100 bg-sky-50/50 p-3.5 text-sm font-semibold text-[#6f88a2]">
                  <Loader2 className="size-4 animate-spin text-sky-500" /> Carregando alunos…
                </div>
              )}
              {!loadingTurmas && !loadingAlunos && filteredAlunos.map((aluno) => (
                <button key={aluno.id} type="button" onClick={() => setSelectedAlunoId(aluno.id)}
                  className={`w-full rounded-2xl border p-3.5 text-left transition-all ${selectedAlunoId === aluno.id ? "border-sky-300/60 bg-sky-50/70 shadow-sm" : "border-sky-100 bg-sky-50/30 hover:border-sky-200 hover:shadow-sm"}`}>
                  <p className={`font-bold ${selectedAlunoId === aluno.id ? "text-sky-700" : "text-[#223246]"}`}>{aluno.nome}</p>
                  <p className="text-xs font-medium text-[#8aa2b9]">{aluno.turma.nome}</p>
                </button>
              ))}
              {!loadingTurmas && !loadingAlunos && !filteredAlunos.length && (
                <div className="pf-empty">
                  {alunos.length ? "Nenhum aluno encontrado." : "Turma sem alunos cadastrados."}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Avaliação + histórico */}
        <div className="space-y-5">
          <Card className="pf-card rounded-[1.4rem] border-sky-100/80 bg-white">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="font-heading text-lg text-[#223246]">Registro de avaliação</CardTitle>
              <CardDescription className="text-[13px] font-semibold text-[#6f88a2]">Use os modelos abaixo para agilizar o preenchimento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-5 pt-0">
              {!selectedAluno && (
                <div className="pf-empty">
                  Selecione um aluno para iniciar a avaliação.
                </div>
              )}

              {selectedAluno && (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="rounded-full bg-sky-500 text-white">{selectedAluno.nome}</Badge>
                    <Badge variant="outline" className="rounded-full border-sky-100 text-[#6f88a2]">{selectedAluno.turma.nome}</Badge>
                    <Badge variant="outline" className="rounded-full border-sky-100 text-[#6f88a2]">{observacoes.length} obs.</Badge>
                    <Badge variant="outline" className="rounded-full border-sky-100 text-[#6f88a2]">{relatorios.length} rel.</Badge>
                    <Link href={`/dashboard/alunos/${selectedAluno.id}`} className="text-xs font-bold text-emerald-600 underline underline-offset-2 hover:text-emerald-500 transition-colors">
                      Abrir ficha completa →
                    </Link>
                  </div>

                  <div>
                    <p className="pf-label">Modelos rápidos</p>
                    <div className="grid gap-2 md:grid-cols-2">
                      {quickTemplates.map((template) => (
                        <button key={template} type="button" onClick={() => setTexto(template)}
                          className="rounded-2xl border border-sky-100 bg-sky-50/30 px-3.5 py-2.5 text-left text-xs font-medium text-[#3d5771] transition hover:border-emerald-200 hover:bg-emerald-50/60 hover:text-emerald-600">
                          {template}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="pf-label">Categoria da observação</p>
                    <div className="flex flex-wrap gap-2">
                      {categoriaOptions.map((item) => (
                        <button key={item.value} type="button" onClick={() => setCategoria(item.value)}
                          className={`rounded-full border px-3.5 py-2 text-[13px] font-bold transition-all ${categoria === item.value ? item.color + " ring-2 ring-offset-1" : "border-sky-100 bg-white text-[#6f88a2] hover:border-sky-200 hover:bg-sky-50/50"}`}>
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Textarea value={texto} onChange={(e) => setTexto(e.target.value)}
                    placeholder="Descreva o que foi observado hoje…"
                    className="min-h-[140px] rounded-2xl border-sky-100 bg-white text-[15px] leading-relaxed text-[#3d5771] placeholder:text-[#a3bdd2] transition-all focus:border-sky-300 focus:ring-sky-100 focus-visible:ring-2" />

                  <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed border-sky-200 bg-sky-50/40 p-4 transition-colors hover:border-sky-300 hover:bg-sky-50/70">
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-100">
                      <Camera className="size-5 text-sky-600" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-[#3d5771]">Adicionar foto</p>
                      <p className="text-xs text-[#8aa2b9]">JPG, PNG ou WEBP</p>
                    </div>
                    <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(e) => setFoto(e.target.files?.[0] ?? null)} className="sr-only" />
                  </label>

                  {fotoPreview && (
                    <a href={fotoPreview} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl border border-sky-100">
                      <Image src={fotoPreview} alt="Pré-visualização" width={960} height={640} unoptimized className="h-40 w-full object-cover" />
                    </a>
                  )}

                  <button type="button" onClick={handleSaveObservation} disabled={savingObservation}
                    className="pf-btn-success w-full">
                    {savingObservation ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
                    {savingObservation ? "Salvando…" : "Salvar avaliação"}
                  </button>
                </>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* IA */}
            <Card className="pf-card rounded-[1.4rem] border-sky-100/80 bg-white">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="font-heading text-lg text-[#223246]">Relatório por IA</CardTitle>
                <CardDescription className="text-[13px] font-semibold text-[#6f88a2]">Disponível a partir de 5 observações.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-5 pt-0">
                <input value={periodo} onChange={(e) => setPeriodo(e.target.value)} placeholder="Período" className="pf-input" />

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#6f88a2]">Progresso para relatório</span>
                    <span className={obsProgress >= 5 ? "text-emerald-600 font-bold" : "text-[#8aa2b9]"}>{obsProgress}/5</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-sky-50">
                    <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-sky-600 transition-all" style={{ width: `${(obsProgress / 5) * 100}%` }} />
                  </div>
                </div>

                <button type="button" onClick={handleGenerateReport} disabled={generatingReport || observacoes.length < 5 || !selectedAluno}
                  className="pf-btn-primary w-full">
                  {generatingReport ? <Loader2 className="size-4 animate-spin" /> : <Bot className="size-4" />}
                  {generatingReport ? "Gerando…" : "✨ Gerar relatório"}
                </button>

                <Link
                  href="/dashboard/relatorios"
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-sm font-bold text-sky-700 transition hover:bg-sky-100"
                >
                  <FileText className="size-4" />
                  Ver histórico completo
                </Link>

                <div className="space-y-2">
                  {(loadingContext ? [] : relatorios.slice(0, 2)).map((r) => (
                    <article key={r.id} className="rounded-2xl border border-sky-100 bg-sky-50/30 p-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-[#8aa2b9]">{r.periodo}</p>
                        <button
                          type="button"
                          onClick={() => void handleDeleteReport(r.id)}
                          disabled={deletingRelatorioId === r.id}
                          className="inline-flex h-7 items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 text-[11px] font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingRelatorioId === r.id ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
                          Excluir
                        </button>
                      </div>
                      <p className="mt-1.5 line-clamp-4 text-sm text-[#3d5771]">{r.texto}</p>
                    </article>
                  ))}
                  {!loadingContext && !relatorios.length && (
                    <div className="pf-empty">Nenhum relatório gerado.</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Histórico */}
            <Card className="pf-card rounded-[1.4rem] border-sky-100/80 bg-white">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="font-heading text-lg text-[#223246]">Últimas observações</CardTitle>
                <CardDescription className="text-[13px] font-semibold text-[#6f88a2]">Histórico rápido do aluno.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5 p-5 pt-0">
                {loadingContext && (
                  <div className="flex items-center gap-2.5 rounded-2xl border border-sky-100 bg-sky-50/50 p-3.5 text-sm font-semibold text-[#6f88a2]">
                    <Loader2 className="size-4 animate-spin text-sky-500" /> Carregando…
                  </div>
                )}
                {!loadingContext && observacoes.slice(0, 6).map((o) => (
                  <article key={o.id} className="rounded-2xl border border-sky-100 bg-sky-50/30 p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-[#8aa2b9]">{new Date(o.createdAt).toLocaleDateString("pt-BR")}</p>
                      <div className="flex items-center gap-2">
                        <span className={`obs-${o.categoria.toLowerCase()} rounded-full px-2.5 py-0.5 text-[10px] font-bold`}>{o.categoria}</span>
                        <button
                          type="button"
                          onClick={() => void handleDeleteObservation(o.id)}
                          disabled={deletingObservacaoId === o.id}
                          className="inline-flex h-7 items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 text-[11px] font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingObservacaoId === o.id ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
                          Excluir
                        </button>
                      </div>
                    </div>
                    <p className="mt-1.5 line-clamp-3 text-sm text-[#3d5771]">{o.texto}</p>
                    {o.fotos?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {o.fotos.map((fotoItem) =>
                          fotoItem.url ? (
                            <a key={fotoItem.id} href={fotoItem.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-gray-200">
                              <Image src={fotoItem.url} alt="Registro da observação" width={84} height={84} className="size-[84px] object-cover" />
                            </a>
                          ) : null,
                        )}
                      </div>
                    )}
                  </article>
                ))}
                {!loadingContext && !observacoes.length && (
                  <div className="pf-empty">Ainda não há observações.</div>
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
      <Card className="pf-card rounded-[1.4rem] border-sky-100/80 bg-white">
        <CardContent className="flex flex-wrap items-center gap-2.5 p-5 md:p-6">
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
