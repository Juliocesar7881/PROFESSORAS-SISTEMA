"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Bot, Camera, FileText, Loader2, Search, Sparkles, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Turma = {
  id: string;
  nome: string;
  faixaEtaria: string;
};

type Aluno = {
  id: string;
  nome: string;
  turma: {
    id: string;
    nome: string;
  };
};

type Observacao = {
  id: string;
  texto: string;
  categoria: "APRENDIZAGEM" | "LINGUAGEM" | "SOCIAL" | "MOTOR" | "CRIATIVIDADE";
  createdAt: string;
};

type Relatorio = {
  id: string;
  texto: string;
  periodo: string;
  createdAt: string;
};

const categoriaOptions: Array<{ value: Observacao["categoria"]; label: string }> = [
  { value: "APRENDIZAGEM", label: "Aprendizagem" },
  { value: "LINGUAGEM", label: "Linguagem" },
  { value: "SOCIAL", label: "Social" },
  { value: "MOTOR", label: "Motor" },
  { value: "CRIATIVIDADE", label: "Criatividade" },
];

const quickTemplates = [
  "Participou com interesse da proposta e concluiu a atividade com apoio leve.",
  "Demonstrou avanço na interação com colegas durante a atividade em grupo.",
  "Precisou de mediação para manter foco, mas respondeu bem aos combinados.",
  "Expressou ideias com autonomia e ampliou vocabulário durante a conversa.",
];

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

  const fotoPreview = useMemo(() => {
    if (!foto) {
      return null;
    }

    return URL.createObjectURL(foto);
  }, [foto]);

  useEffect(() => {
    return () => {
      if (fotoPreview) {
        URL.revokeObjectURL(fotoPreview);
      }
    };
  }, [fotoPreview]);

  const loadTurmas = useCallback(async () => {
    setLoadingTurmas(true);

    try {
      const response = await fetch("/api/turmas");
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error?.message ?? "Falha ao carregar turmas");
      }

      const loadedTurmas = (json.data ?? []) as Turma[];
      setTurmas(loadedTurmas);

      if (loadedTurmas.length) {
        setSelectedTurma((current) => current || loadedTurmas[0].id);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar turmas";
      toast.error(message);
      setTurmas([]);
    } finally {
      setLoadingTurmas(false);
    }
  }, []);

  const loadAlunos = useCallback(async (turmaId: string) => {
    setLoadingAlunos(true);

    try {
      const params = new URLSearchParams({ turmaId });
      const response = await fetch(`/api/alunos?${params.toString()}`);
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error?.message ?? "Falha ao carregar alunos");
      }

      const loadedAlunos = (json.data ?? []) as Aluno[];
      setAlunos(loadedAlunos);

      setSelectedAlunoId((current) => {
        if (current && loadedAlunos.some((aluno) => aluno.id === current)) {
          return current;
        }

        return loadedAlunos[0]?.id ?? "";
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar alunos";
      toast.error(message);
      setAlunos([]);
      setSelectedAlunoId("");
    } finally {
      setLoadingAlunos(false);
    }
  }, []);

  const loadAlunoContext = useCallback(async (alunoId: string) => {
    setLoadingContext(true);

    try {
      const [observacoesResponse, relatoriosResponse] = await Promise.all([
        fetch(`/api/observacoes?alunoId=${alunoId}`),
        fetch(`/api/relatorios?alunoId=${alunoId}`),
      ]);

      const observacoesJson = await observacoesResponse.json();
      const relatoriosJson = await relatoriosResponse.json();

      if (!observacoesResponse.ok) {
        throw new Error(observacoesJson.error?.message ?? "Falha ao carregar observações");
      }

      if (!relatoriosResponse.ok) {
        throw new Error(relatoriosJson.error?.message ?? "Falha ao carregar relatórios");
      }

      setObservacoes(observacoesJson.data ?? []);
      setRelatorios(relatoriosJson.data ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar dados do aluno";
      toast.error(message);
      setObservacoes([]);
      setRelatorios([]);
    } finally {
      setLoadingContext(false);
    }
  }, []);

  useEffect(() => {
    void loadTurmas();
  }, [loadTurmas]);

  useEffect(() => {
    if (!selectedTurma) {
      return;
    }

    void loadAlunos(selectedTurma);
  }, [selectedTurma, loadAlunos]);

  useEffect(() => {
    if (!selectedAlunoId) {
      setObservacoes([]);
      setRelatorios([]);
      return;
    }

    void loadAlunoContext(selectedAlunoId);
  }, [selectedAlunoId, loadAlunoContext]);

  const selectedAluno = useMemo(
    () => alunos.find((aluno) => aluno.id === selectedAlunoId) ?? null,
    [alunos, selectedAlunoId],
  );

  const filteredAlunos = useMemo(() => {
    const normalizedSearch = searchAluno.trim().toLowerCase();

    if (!normalizedSearch) {
      return alunos;
    }

    return alunos.filter((aluno) => aluno.nome.toLowerCase().includes(normalizedSearch));
  }, [alunos, searchAluno]);

  const handleSaveObservation = async () => {
    if (!selectedAlunoId) {
      toast.error("Selecione um aluno para registrar a avaliação");
      return;
    }

    if (!texto.trim()) {
      toast.error("Escreva uma observação antes de salvar");
      return;
    }

    setSavingObservation(true);

    try {
      const formData = new FormData();
      formData.append("texto", texto);
      formData.append("categoria", categoria);
      formData.append("alunoId", selectedAlunoId);

      if (foto) {
        formData.append("foto", foto);
      }

      const response = await fetch("/api/observacoes", {
        method: "POST",
        body: formData,
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error?.message ?? "Falha ao salvar observação");
      }

      setTexto("");
      setFoto(null);
      toast.success("Avaliação registrada");
      await loadAlunoContext(selectedAlunoId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao salvar observação";
      toast.error(message);
    } finally {
      setSavingObservation(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedAlunoId) {
      toast.error("Selecione um aluno para gerar o relatório");
      return;
    }

    if (observacoes.length < 5) {
      toast.error("São necessárias ao menos 5 observações para gerar o relatório");
      return;
    }

    setGeneratingReport(true);

    try {
      const response = await fetch("/api/relatorios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alunoId: selectedAlunoId,
          periodo,
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error?.message ?? "Falha ao gerar relatório");
      }

      toast.success("Relatório gerado com sucesso");
      await loadAlunoContext(selectedAlunoId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao gerar relatório";
      toast.error(message);
    } finally {
      setGeneratingReport(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-3xl text-slate-900">Avaliações dos alunos</CardTitle>
          <CardDescription className="text-slate-600">Fluxo simples: escolha a turma, selecione o aluno e registre observações. O relatório com IA aparece quando houver base suficiente.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-cyan-50 px-2.5 py-1 font-semibold text-cyan-700">Passo 1: Turma</span>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">Passo 2: Aluno</span>
          <span className="rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-700">Passo 3: Avaliação</span>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-2xl text-slate-900">Turma e alunos</CardTitle>
            <CardDescription className="text-slate-600">Selecione quem será avaliado hoje.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <select
              value={selectedTurma}
              onChange={(event) => setSelectedTurma(event.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700"
              disabled={loadingTurmas || !turmas.length}
            >
              {!turmas.length && <option value="">Sem turmas cadastradas</option>}
              {turmas.map((turma) => (
                <option key={turma.id} value={turma.id}>
                  {turma.nome} ({turma.faixaEtaria})
                </option>
              ))}
            </select>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-slate-400" />
              <Input
                className="border-slate-200 bg-slate-50 pl-9"
                placeholder="Buscar aluno"
                value={searchAluno}
                onChange={(event) => setSearchAluno(event.target.value)}
              />
            </div>

            <div className="max-h-[620px] space-y-2 overflow-y-auto pr-1">
              {(loadingTurmas || loadingAlunos) && (
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                  <Loader2 className="size-4 animate-spin" />
                  Carregando alunos...
                </div>
              )}

              {!loadingTurmas && !loadingAlunos &&
                filteredAlunos.map((aluno) => (
                  <button
                    type="button"
                    key={aluno.id}
                    onClick={() => setSelectedAlunoId(aluno.id)}
                    className={`w-full rounded-xl border p-3 text-left transition ${selectedAlunoId === aluno.id ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-slate-50"}`}
                  >
                    <p className="font-semibold text-slate-900">{aluno.nome}</p>
                    <p className="text-xs text-slate-500">{aluno.turma.nome}</p>
                  </button>
                ))}

              {!loadingTurmas && !loadingAlunos && !filteredAlunos.length && (
                <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
                  {alunos.length
                    ? "Nenhum aluno encontrado para os filtros atuais."
                    : "Essa turma ainda não possui alunos cadastrados."}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="font-heading text-2xl text-slate-900">Registro de avaliação</CardTitle>
              <CardDescription className="text-slate-600">Use os modelos abaixo para agilizar o preenchimento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedAluno && (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                  Selecione um aluno para iniciar a avaliação.
                </div>
              )}

              {selectedAluno && (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-rose-500 text-white">{selectedAluno.nome}</Badge>
                    <Badge variant="secondary">{selectedAluno.turma.nome}</Badge>
                    <Badge variant="outline">{observacoes.length} observações</Badge>
                    <Badge variant="outline">{relatorios.length} relatórios</Badge>
                    <Link href={`/dashboard/alunos/${selectedAluno.id}`} className="text-xs font-semibold text-emerald-700 underline">
                      Abrir ficha completa
                    </Link>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-slate-500">Modelos rápidos</p>
                    <div className="grid gap-2 md:grid-cols-2">
                      {quickTemplates.map((template) => (
                        <button
                          key={template}
                          type="button"
                          onClick={() => setTexto(template)}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50"
                        >
                          {template}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-slate-500">Categoria da observação</p>
                    <div className="flex flex-wrap gap-2">
                      {categoriaOptions.map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => setCategoria(item.value)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${categoria === item.value ? "border-rose-200 bg-rose-50 text-rose-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Textarea
                    value={texto}
                    onChange={(event) => setTexto(event.target.value)}
                    placeholder="Descreva o que foi observado hoje..."
                    className="min-h-28 border-slate-200 bg-slate-50"
                  />

                  <Input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(event) => setFoto(event.target.files?.[0] ?? null)}
                    className="border-slate-200 bg-slate-50"
                  />

                  {fotoPreview && (
                    <a href={fotoPreview} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-slate-200">
                      <Image src={fotoPreview} alt="Pré-visualização da foto" width={960} height={640} unoptimized className="h-40 w-full object-cover" />
                    </a>
                  )}

                  <Button
                    type="button"
                    onClick={handleSaveObservation}
                    disabled={savingObservation}
                    className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    {savingObservation ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Camera className="mr-2 size-4" />}
                    {savingObservation ? "Salvando..." : "Salvar avaliação"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="font-heading text-xl text-slate-900">Relatório por IA</CardTitle>
                <CardDescription className="text-slate-600">Disponível a partir de 5 observações registradas.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  value={periodo}
                  onChange={(event) => setPeriodo(event.target.value)}
                  placeholder="Período"
                  className="border-slate-200 bg-slate-50"
                />

                <Button
                  type="button"
                  onClick={handleGenerateReport}
                  disabled={generatingReport || observacoes.length < 5 || !selectedAluno}
                  className="w-full bg-rose-500 text-white hover:bg-rose-600"
                >
                  {generatingReport ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Bot className="mr-2 size-4" />}
                  {generatingReport ? "Gerando..." : "Gerar relatório"}
                </Button>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                  <p className="font-semibold text-slate-700">Progresso para relatório</p>
                  <p className="mt-1">{Math.min(observacoes.length, 5)} de 5 observações necessárias.</p>
                </div>

                <div className="space-y-2">
                  {(loadingContext ? [] : relatorios.slice(0, 2)).map((relatorio) => (
                    <article key={relatorio.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-semibold text-slate-500">{relatorio.periodo}</p>
                      <p className="mt-1 line-clamp-4 text-sm text-slate-700">{relatorio.texto}</p>
                    </article>
                  ))}

                  {!loadingContext && !relatorios.length && (
                    <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
                      Nenhum relatório gerado para este aluno.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="font-heading text-xl text-slate-900">Últimas observações</CardTitle>
                <CardDescription className="text-slate-600">Histórico rápido para consulta durante o atendimento.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {loadingContext && (
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                    <Loader2 className="size-4 animate-spin" />
                    Carregando histórico...
                  </div>
                )}

                {!loadingContext &&
                  observacoes.slice(0, 6).map((observacao) => (
                    <article key={observacao.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-600">{new Date(observacao.createdAt).toLocaleDateString("pt-BR")}</p>
                        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600">{observacao.categoria}</span>
                      </div>
                      <p className="mt-1 line-clamp-3 text-sm text-slate-700">{observacao.texto}</p>
                    </article>
                  ))}

                {!loadingContext && !observacoes.length && (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
                    Ainda não há observações para este aluno.
                  </p>
                )}

                {!!selectedAluno && (
                  <Link href={`/dashboard/alunos/${selectedAluno.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 underline">
                    <UserRound className="size-3.5" />
                    Abrir perfil completo do aluno
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="flex flex-wrap items-center gap-2 py-4 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">
            <Sparkles className="size-3.5" />
            Linguagem simples para uso no dia a dia
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2.5 py-1 font-semibold text-cyan-700">
            <FileText className="size-3.5" />
            Registros sempre salvos no histórico do aluno
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
