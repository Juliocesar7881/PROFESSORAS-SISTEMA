"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Bot,
  Check,
  Download,
  FileText,
  Loader2,
  Pencil,
  Save,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import { CopyTextButton } from "@/components/copy-text-button";
import { DashboardFilterBar } from "@/components/dashboard-filter-bar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export type RelatorioHistoryItem = {
  id: string;
  texto: string;
  periodo: string;
  nomeCrianca?: string;
  contexto?: string;
  descricaoBase?: string;
  modeloIa?: string;
  createdAt: string;
  updatedAt?: string;
};

type AvaliacoesClientProps = {
  initialReports: RelatorioHistoryItem[];
};

type EvaluationDraft = {
  texto: string;
  nomeCrianca: string;
  contexto: string;
  periodo: string;
};

const quickEvaluationExamples = [
  "Participa das rodas de conversa, demonstra curiosidade por histórias e ainda precisa de apoio para esperar sua vez nas brincadeiras coletivas.",
  "Tem avançado na autonomia da rotina, organiza seus materiais com menos ajuda e busca os colegas para resolver pequenos conflitos.",
  "Gosta de propostas com música e movimento, interage bem em pequenos grupos e responde melhor quando os combinados são explicados antes da atividade.",
];

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getModelLabel(model?: string) {
  if (!model) return "IA";
  if (model.includes("3.5-flash")) return "Gemini 3.5 Flash";
  if (model.includes("3.1-flash-lite")) return "Gemini 3.1 Flash Lite";
  if (model.includes("2.5-flash-lite")) return "Gemini 2.5 Flash Lite";
  if (model.includes("2.5-flash")) return "Gemini 2.5 Flash";
  return "Gemini";
}

function isEdited(relatorio: RelatorioHistoryItem) {
  if (!relatorio.updatedAt) return false;
  return new Date(relatorio.updatedAt).getTime() - new Date(relatorio.createdAt).getTime() > 1000;
}

function toDraft(relatorio: RelatorioHistoryItem): EvaluationDraft {
  return {
    texto: relatorio.texto,
    nomeCrianca: relatorio.nomeCrianca ?? "",
    contexto: relatorio.contexto ?? "",
    periodo: relatorio.periodo,
  };
}

function downloadWord(relatorio: RelatorioHistoryItem) {
  const title = `Avaliação pedagógica${relatorio.nomeCrianca ? ` - ${relatorio.nomeCrianca}` : ""}`;
  const html = `
    <html>
      <head><meta charset="utf-8" /></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #2f2830;">
        <h1>${escapeHtml(title)}</h1>
        <p><strong>Período:</strong> ${escapeHtml(relatorio.periodo)}</p>
        ${relatorio.contexto ? `<p><strong>Contexto:</strong> ${escapeHtml(relatorio.contexto)}</p>` : ""}
        ${relatorio.texto
          .split(/\n{2,}/)
          .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`)
          .join("")}
      </body>
    </html>
  `;
  const blob = new Blob([html], { type: "application/msword;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `avaliacao-${slugify(relatorio.nomeCrianca || "crianca")}-${slugify(relatorio.periodo)}.doc`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function AvaliacoesClient({ initialReports }: AvaliacoesClientProps) {
  const [historicoRelatorios, setHistoricoRelatorios] = useState<RelatorioHistoryItem[]>(initialReports);
  const [nomeCrianca, setNomeCrianca] = useState("");
  const [contexto, setContexto] = useState("");
  const [periodo, setPeriodo] = useState("Bimestre atual");
  const [descricaoRapida, setDescricaoRapida] = useState("");
  const [generatingReport, setGeneratingReport] = useState(false);
  const [deletingRelatorioId, setDeletingRelatorioId] = useState<string | null>(null);
  const [editingRelatorioId, setEditingRelatorioId] = useState<string | null>(null);
  const [savingRelatorioId, setSavingRelatorioId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EvaluationDraft | null>(null);

  const descricaoTrimmed = descricaoRapida.trim();
  const canGenerateReport = descricaoTrimmed.length >= 20 && periodo.trim().length >= 3;
  const characterProgress = useMemo(
    () => Math.min(100, Math.round((descricaoTrimmed.length / 180) * 100)),
    [descricaoTrimmed.length],
  );

  const startEditing = (relatorio: RelatorioHistoryItem) => {
    setEditingRelatorioId(relatorio.id);
    setDraft(toDraft(relatorio));
  };

  const cancelEditing = () => {
    setEditingRelatorioId(null);
    setDraft(null);
  };

  const handleGenerateReport = async () => {
    if (!canGenerateReport) {
      toast.error("Escreva uma descrição com pelo menos 20 caracteres.");
      return;
    }

    setGeneratingReport(true);
    try {
      const response = await fetch("/api/relatorios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modo: "descricao",
          nomeCrianca: nomeCrianca.trim() || undefined,
          contexto: contexto.trim() || undefined,
          periodo: periodo.trim(),
          descricaoRapida: descricaoTrimmed,
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message ?? "Falha ao gerar avaliação");

      const created = json.data as RelatorioHistoryItem | undefined;
      if (created) {
        const createdReport: RelatorioHistoryItem = {
          id: created.id,
          texto: created.texto,
          periodo: created.periodo,
          nomeCrianca: created.nomeCrianca || nomeCrianca.trim(),
          contexto: created.contexto || contexto.trim(),
          descricaoBase: descricaoTrimmed,
          modeloIa: created.modeloIa,
          createdAt: new Date(created.createdAt).toISOString(),
          updatedAt: created.updatedAt ? new Date(created.updatedAt).toISOString() : undefined,
        };

        setHistoricoRelatorios((current) => [createdReport, ...current.filter((item) => item.id !== created.id)]);
        startEditing(createdReport);
        window.setTimeout(() => document.getElementById(`avaliacao-${created.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
      }

      setDescricaoRapida("");
      toast.success("Avaliação gerada pela IA. Revise e salve seus ajustes.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao gerar avaliação");
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleSaveReport = async (relatorioId: string) => {
    if (!draft || draft.texto.trim().length < 80 || draft.periodo.trim().length < 3) {
      toast.error("Revise o texto e mantenha ao menos 80 caracteres.");
      return;
    }

    setSavingRelatorioId(relatorioId);
    try {
      const response = await fetch(`/api/relatorios/${relatorioId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          texto: draft.texto.trim(),
          nomeCrianca: draft.nomeCrianca.trim() || undefined,
          contexto: draft.contexto.trim() || undefined,
          periodo: draft.periodo.trim(),
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message ?? "Falha ao salvar a avaliação");

      const updated = json.data as RelatorioHistoryItem;
      setHistoricoRelatorios((current) =>
        current.map((item) =>
          item.id === relatorioId
            ? {
                ...item,
                texto: updated.texto,
                nomeCrianca: updated.nomeCrianca ?? "",
                contexto: updated.contexto ?? "",
                periodo: updated.periodo,
                updatedAt: updated.updatedAt ? new Date(updated.updatedAt).toISOString() : new Date().toISOString(),
              }
            : item,
        ),
      );
      cancelEditing();
      toast.success("Avaliação revisada e salva");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao salvar a avaliação");
    } finally {
      setSavingRelatorioId(null);
    }
  };

  const handleDeleteReport = async (relatorioId: string) => {
    if (!window.confirm("Deseja excluir esta avaliação? Esta ação não pode ser desfeita.")) return;

    setDeletingRelatorioId(relatorioId);
    try {
      const response = await fetch(`/api/relatorios/${relatorioId}`, { method: "DELETE" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message ?? "Falha ao excluir avaliação");
      setHistoricoRelatorios((current) => current.filter((item) => item.id !== relatorioId));
      if (editingRelatorioId === relatorioId) cancelEditing();
      toast.success("Avaliação excluída");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao excluir avaliação");
    } finally {
      setDeletingRelatorioId(null);
    }
  };

  return (
    <div className="mx-auto max-w-[1280px] space-y-4">
      <DashboardFilterBar
        title="Avaliação com IA"
        summary={`${historicoRelatorios.length} avaliação${historicoRelatorios.length !== 1 ? "ões" : ""} no histórico`}
        controlsClassName="lg:flex-wrap"
      >
        <span className="inline-flex h-11 items-center gap-2 rounded-xl border-2 border-[#e5c4d3] bg-white px-4 text-sm font-black text-[#a65f7f]">
          <Sparkles className="size-4" />
          Gemini
        </span>
        <span className="inline-flex h-11 items-center gap-2 rounded-xl border-2 border-[#e5c4d3] bg-white px-4 text-sm font-black text-[#a65f7f]">
          <Pencil className="size-4" />
          Revisão editável
        </span>
        <span className="inline-flex h-11 items-center gap-2 rounded-xl border-2 border-[#e5c4d3] bg-white px-4 text-sm font-black text-[#a65f7f]">
          PDF liberado
        </span>
      </DashboardFilterBar>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card size="sm" className="border-[#f0e2e8] bg-white/95">
          <CardHeader className="px-4">
            <CardTitle>Nova avaliação</CardTitle>
            <CardDescription>Registre evidências reais; a IA organiza o texto para sua revisão.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-4">
            <div className="grid gap-3 md:grid-cols-3">
              <label>
                <span className="pf-label">Nome da criança</span>
                <input value={nomeCrianca} onChange={(event) => setNomeCrianca(event.target.value)} placeholder="Opcional" className="pf-input h-11" />
              </label>
              <label>
                <span className="pf-label">Período</span>
                <input value={periodo} onChange={(event) => setPeriodo(event.target.value)} placeholder="Bimestre atual" className="pf-input h-11" />
              </label>
              <label>
                <span className="pf-label">Contexto</span>
                <input value={contexto} onChange={(event) => setContexto(event.target.value)} placeholder="Ex: Jardim II, adaptação" className="pf-input h-11" />
              </label>
            </div>

            <label className="block">
              <span className="pf-label">Descrição da professora</span>
              <Textarea
                value={descricaoRapida}
                onChange={(event) => setDescricaoRapida(event.target.value)}
                placeholder="Conte como a criança participa, interage e aprende. Inclua avanços percebidos, situações concretas e apoios que ainda ajudam."
                className="min-h-[230px] rounded-xl border-[#f0e2e8] bg-white text-[15px] leading-relaxed text-[#74616d] placeholder:text-[#a99ba5] focus:border-[#d8a4bb] focus-visible:ring-2"
              />
            </label>

            <div className="rounded-xl border border-[#f0e2e8] bg-[#fff3f7]/60 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-black text-[#857582]">
                <span>20 mínimo · 180+ recomendado para maior precisão</span>
                <span className={descricaoTrimmed.length >= 180 ? "text-emerald-600" : descricaoTrimmed.length >= 20 ? "text-[#a65f7f]" : "text-[#9b8d96]"}>
                  {descricaoTrimmed.length} caracteres
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                <div className="h-full rounded-full bg-[#a65f7f] transition-all" style={{ width: `${characterProgress}%` }} />
              </div>
            </div>

            <div>
              <p className="pf-label">Exemplos de evidências</p>
              <div className="grid gap-2 lg:grid-cols-3">
                {quickEvaluationExamples.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setDescricaoRapida(example)}
                    className="rounded-lg border border-[#f0e2e8] bg-[#fff3f7]/50 px-3 py-2 text-left text-xs font-bold leading-relaxed text-[#74616d] transition hover:border-[#e5c4d3] hover:bg-[#fff3f7]"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            <button type="button" onClick={handleGenerateReport} disabled={generatingReport || !canGenerateReport} className="pf-btn-primary h-12 w-full text-sm">
              {generatingReport ? <Loader2 className="size-4 animate-spin" /> : <Bot className="size-4" />}
              {generatingReport ? "Analisando evidências..." : "Gerar e revisar avaliação"}
            </button>
          </CardContent>
        </Card>

        <Card size="sm" className="border-[#f0e2e8] bg-white/95 xl:sticky xl:top-28 xl:self-start">
          <CardHeader className="px-4">
            <CardTitle>Evidências úteis</CardTitle>
            <CardDescription>Quanto mais concreto o registro, melhor o resultado.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 px-4 text-sm font-semibold leading-relaxed text-[#74616d]">
            {["Participação e interesses", "Interações e comunicação", "Autonomia e estratégias", "Avanços observados", "Apoios que ainda favorecem"].map((item) => (
              <p key={item} className="flex items-center gap-2 rounded-xl border border-[#f0e2e8] bg-[#fff3f7]/45 p-3">
                <Check className="size-4 shrink-0 text-[#a65f7f]" />
                {item}
              </p>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card size="sm" className="border-[#f0e2e8] bg-white/95">
        <CardHeader className="px-4">
          <CardTitle>Histórico e revisão</CardTitle>
          <CardDescription>Edite o texto no Pequenos Passos antes de copiar ou exportar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 px-4">
          {!historicoRelatorios.length ? (
            <div className="pf-empty py-12">Nenhuma avaliação ainda. Gere a primeira acima.</div>
          ) : (
            historicoRelatorios.map((relatorio) => {
              const editing = editingRelatorioId === relatorio.id && draft;
              const saving = savingRelatorioId === relatorio.id;

              return (
                <article
                  id={`avaliacao-${relatorio.id}`}
                  key={relatorio.id}
                  className="scroll-mt-28 rounded-xl border border-[#f0e2e8] bg-white p-4 transition hover:border-[#e5c4d3] hover:shadow-sm"
                >
                  {editing ? (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="rounded-full border border-[#e5c4d3] bg-[#fff3f7] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[#a65f7f]">
                            Revisando
                          </span>
                          <span className="text-xs font-bold text-[#9b8d96]">{getModelLabel(relatorio.modeloIa)}</span>
                        </div>
                        <button type="button" onClick={cancelEditing} className="inline-flex size-9 items-center justify-center rounded-lg border border-[#e5c4d3] text-[#857582] transition hover:bg-[#fff3f7]" aria-label="Cancelar edição">
                          <X className="size-4" />
                        </button>
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        <label>
                          <span className="pf-label">Nome da criança</span>
                          <input value={draft.nomeCrianca} onChange={(event) => setDraft({ ...draft, nomeCrianca: event.target.value })} className="pf-input h-10" />
                        </label>
                        <label>
                          <span className="pf-label">Período</span>
                          <input value={draft.periodo} onChange={(event) => setDraft({ ...draft, periodo: event.target.value })} className="pf-input h-10" />
                        </label>
                        <label>
                          <span className="pf-label">Contexto</span>
                          <input value={draft.contexto} onChange={(event) => setDraft({ ...draft, contexto: event.target.value })} className="pf-input h-10" />
                        </label>
                      </div>

                      <label className="block">
                        <span className="pf-label">Texto da avaliação</span>
                        <Textarea
                          value={draft.texto}
                          onChange={(event) => setDraft({ ...draft, texto: event.target.value })}
                          className="min-h-[340px] rounded-xl border-[#e5c4d3] bg-[#fffdfd] text-[15px] leading-7 text-[#4e414a] focus:border-[#d8a4bb] focus-visible:ring-2"
                        />
                      </label>

                      <div className="flex flex-col-reverse gap-2 border-t border-[#f5ecf1] pt-3 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-xs font-bold text-[#9b8d96]">{draft.texto.length} caracteres</span>
                        <div className="flex gap-2">
                          <button type="button" onClick={cancelEditing} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-[#e5c4d3] bg-white px-4 text-xs font-black text-[#857582] transition hover:bg-[#fff3f7] sm:flex-none">
                            <X className="size-3.5" /> Cancelar
                          </button>
                          <button type="button" onClick={() => void handleSaveReport(relatorio.id)} disabled={saving || draft.texto.trim().length < 80} className="pf-btn-primary h-10 flex-1 px-4 text-xs sm:flex-none">
                            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                            {saving ? "Salvando..." : "Salvar revisão"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate font-heading text-lg leading-tight text-[#312834]">{relatorio.nomeCrianca || "Criança sem nome"}</p>
                            <span className="rounded-full border border-[#e5c4d3] bg-[#fff3f7] px-2 py-0.5 text-[10px] font-black text-[#a65f7f]">
                              {getModelLabel(relatorio.modeloIa)}
                            </span>
                            {isEdited(relatorio) ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                                <Check className="size-3" /> Revisada
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-xs font-bold text-[#9b8d96]">
                            {[relatorio.contexto, relatorio.periodo, new Date(relatorio.createdAt).toLocaleDateString("pt-BR")].filter(Boolean).join(" | ")}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleDeleteReport(relatorio.id)}
                          disabled={deletingRelatorioId === relatorio.id}
                          className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-60"
                          aria-label="Excluir avaliação"
                        >
                          {deletingRelatorioId === relatorio.id ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3.5" />}
                        </button>
                      </div>

                      <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#66545f]">{relatorio.texto}</p>

                      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#f5ecf1] pt-3">
                        <button type="button" onClick={() => startEditing(relatorio)} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#a65f7f] px-3 text-xs font-black text-white transition hover:bg-[#8b4e6a]">
                          <Pencil className="size-3.5" /> Editar
                        </button>
                        <CopyTextButton text={relatorio.texto} label="Copiar" />

                        <button type="button" onClick={() => downloadWord(relatorio)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#e5c4d3] bg-[#fff3f7] px-3 text-xs font-black text-[#a65f7f] transition hover:bg-[#f8dbe7]">
                          <FileText className="size-3.5" /> Word
                        </button>

                        <a href={`/api/relatorios/export?relatorioId=${relatorio.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#e5c4d3] bg-[#fff3f7] px-3 text-xs font-black text-[#a65f7f] transition hover:bg-[#f8dbe7]">
                          <Download className="size-3.5" /> PDF
                        </a>
                      </div>
                    </>
                  )}
                </article>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
