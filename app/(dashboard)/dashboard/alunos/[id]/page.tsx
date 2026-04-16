"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Bot, Camera, CalendarDays, ClipboardList, Filter, Loader2, NotebookPen, Trash2, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Observacao = {
  id: string;
  texto: string;
  categoria: "APRENDIZAGEM" | "LINGUAGEM" | "SOCIAL" | "MOTOR" | "CRIATIVIDADE";
  createdAt: string;
  fotos: Array<{ id: string; url: string | null }>;
};

type Relatorio = { id: string; texto: string; periodo: string; createdAt: string };
type AlunoDetail = {
  id: string;
  nome: string;
  dataNasc: string;
  fotoKey?: string | null;
  turma: {
    nome: string;
  };
};

const categorias = ["APRENDIZAGEM", "LINGUAGEM", "SOCIAL", "MOTOR", "CRIATIVIDADE"] as const;

export default function AlunoDetailPage() {
  const params = useParams<{ id: string }>();
  const alunoId = typeof params?.id === "string" ? params.id : "";
  const [aluno, setAluno] = useState<AlunoDetail | null>(null);
  const [observacoes, setObservacoes] = useState<Observacao[]>([]);
  const [relatorios, setRelatorios] = useState<Relatorio[]>([]);
  const [texto, setTexto] = useState("");
  const [categoria, setCategoria] = useState<(typeof categorias)[number]>("APRENDIZAGEM");
  const [foto, setFoto] = useState<File | null>(null);
  const [periodo, setPeriodo] = useState("Bimestre atual");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("TODAS");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [deletingObservacaoId, setDeletingObservacaoId] = useState<string | null>(null);
  const [deletingRelatorioId, setDeletingRelatorioId] = useState<string | null>(null);

  useEffect(() => {
    if (!foto) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(foto);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [foto]);

  const load = useCallback(async () => {
    if (!alunoId) {
      return;
    }

    const [alunoResponse, observacoesResponse, relatoriosResponse] = await Promise.all([
      fetch(`/api/alunos/${alunoId}`),
      fetch(`/api/observacoes?alunoId=${alunoId}`),
      fetch(`/api/relatorios?alunoId=${alunoId}`),
    ]);

    const [alunoJson, observacoesJson, relatoriosJson] = await Promise.all([
      alunoResponse.json(),
      observacoesResponse.json(),
      relatoriosResponse.json(),
    ]);

    if (!alunoResponse.ok) {
      throw new Error(alunoJson.error?.message ?? "Falha ao carregar aluno");
    }

    if (!observacoesResponse.ok) {
      throw new Error(observacoesJson.error?.message ?? "Falha ao carregar observações");
    }

    if (!relatoriosResponse.ok) {
      throw new Error(relatoriosJson.error?.message ?? "Falha ao carregar relatórios");
    }

    setAluno(alunoJson.data ?? null);
    setObservacoes(observacoesJson.data ?? []);
    setRelatorios(relatoriosJson.data ?? []);
  }, [alunoId]);

  useEffect(() => {
    const execute = async () => {
      try {
        await load();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Falha ao carregar dados do aluno");
        setAluno(null);
        setObservacoes([]);
        setRelatorios([]);
      }
    };

    void execute();
  }, [load]);

  const observacoesFiltradas = useMemo(() => {
    if (filtroCategoria === "TODAS") {
      return observacoes;
    }

    return observacoes.filter((item) => item.categoria === filtroCategoria);
  }, [filtroCategoria, observacoes]);

  const observacoesOrdenadas = useMemo(
    () => [...observacoesFiltradas].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [observacoesFiltradas],
  );

  const alunoIdade = useMemo(() => {
    if (!aluno?.dataNasc) {
      return "-";
    }

    const birth = new Date(aluno.dataNasc);

    if (Number.isNaN(birth.getTime())) {
      return "-";
    }

    const years = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    return `${Math.max(0, years)} ano(s)`;
  }, [aluno?.dataNasc]);

  const initials = useMemo(() => {
    if (!aluno?.nome) {
      return "A";
    }

    return aluno.nome
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }, [aluno?.nome]);

  const getCategoriaClass = (categoriaValue: string) => {
    switch (categoriaValue) {
      case "APRENDIZAGEM":
        return "obs-aprendizagem";
      case "LINGUAGEM":
        return "obs-linguagem";
      case "SOCIAL":
        return "obs-social";
      case "MOTOR":
        return "obs-motor";
      case "CRIATIVIDADE":
        return "obs-criatividade";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const salvarObservacao = async () => {
    if (!texto.trim()) {
      toast.error("Digite uma observação antes de salvar");
      return;
    }

    const formData = new FormData();
    formData.append("texto", texto);
    formData.append("categoria", categoria);
    formData.append("alunoId", alunoId);

    if (foto) {
      formData.append("foto", foto);
    }

    const response = await fetch("/api/observacoes", {
      method: "POST",
      body: formData,
    });

    const json = (await response.json()) as {
      data?: {
        upload?: {
          uploadedCount?: number;
          failedCount?: number;
          message?: string;
        };
      };
      error?: { message?: string };
    };

    if (!response.ok) {
      toast.error(json.error?.message ?? "Falha ao salvar observação");
      return;
    }

    setTexto("");
    setFoto(null);

    const upload = json.data?.upload;
    const failedCount = upload?.failedCount ?? 0;

    if (failedCount > 0) {
      toast.warning(upload?.message ?? "Observação salva, mas houve falha no envio de imagem.");
    } else {
      toast.success(upload?.message ?? "Observação salva");
    }

    try {
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao atualizar tela");
    }
  };

  const gerarRelatorio = async () => {
    const response = await fetch("/api/relatorios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        alunoId,
        periodo,
      }),
    });

    const json = await response.json();

    if (!response.ok) {
      toast.error(json.error?.message ?? "Falha na geração do relatório");
      return;
    }

    toast.success("Relatório gerado e salvo");
    try {
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao atualizar tela");
    }
  };

  const excluirObservacao = async (observacaoId: string) => {
    if (!window.confirm("Deseja excluir esta observação? Esta ação não pode ser desfeita.")) {
      return;
    }

    setDeletingObservacaoId(observacaoId);

    try {
      const response = await fetch(`/api/observacoes/${observacaoId}`, {
        method: "DELETE",
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error?.message ?? "Falha ao excluir observação");
      }

      setObservacoes((current) => current.filter((item) => item.id !== observacaoId));
      toast.success("Observação excluída");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao excluir observação");
    } finally {
      setDeletingObservacaoId(null);
    }
  };

  const excluirRelatorio = async (relatorioId: string) => {
    if (!window.confirm("Deseja excluir este relatório? Esta ação não pode ser desfeita.")) {
      return;
    }

    setDeletingRelatorioId(relatorioId);

    try {
      const response = await fetch(`/api/relatorios/${relatorioId}`, {
        method: "DELETE",
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error?.message ?? "Falha ao excluir relatório");
      }

      setRelatorios((current) => current.filter((item) => item.id !== relatorioId));
      toast.success("Relatório excluído");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao excluir relatório");
    } finally {
      setDeletingRelatorioId(null);
    }
  };

  if (!aluno) {
    return (
      <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <CardContent className="py-8 text-gray-500">Carregando aluno...</CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="inline-flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#a78bfa] text-sm font-bold text-white shadow-sm">
              {initials}
            </div>
            <div>
              <CardTitle className="font-heading text-3xl text-gray-900">{aluno.nome}</CardTitle>
              <CardDescription className="text-gray-500">{aluno.turma.nome} • {alunoIdade}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="mb-2 inline-flex items-center gap-2 text-sm text-gray-600">
              <NotebookPen className="size-4 text-emerald-500" />
              Nova observação
            </p>
            <Textarea value={texto} onChange={(event) => setTexto(event.target.value)} placeholder="O que você observou hoje?" className="border-gray-200 bg-white" />
            <div className="mt-2 flex flex-wrap gap-2">
              {categorias.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategoria(item)}
                  className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${categoria === item ? "border-violet-200 bg-violet-50 text-[#6C5CE7]" : "border-gray-200 bg-white text-gray-500 hover:border-violet-200 hover:bg-violet-50/60"}`}
                >
                  {item}
                </button>
              ))}
            </div>
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              onChange={(event) => setFoto(event.target.files?.[0] ?? null)}
              className="mt-3 border-gray-200 bg-white"
            />

            <p className="mt-2 text-xs text-gray-400">Formatos recomendados: JPG, PNG ou WEBP.</p>

            {previewUrl && (
              <a href={previewUrl} target="_blank" rel="noreferrer" className="mt-3 block overflow-hidden rounded-xl border border-gray-200">
                <Image src={previewUrl} alt="Pré-visualização" width={960} height={640} unoptimized className="h-40 w-full object-cover" />
              </a>
            )}

            <Button onClick={salvarObservacao} className="mt-3 w-full bg-[#00B894] text-white hover:bg-[#00a583]">
              <Camera className="mr-2 size-4" />
              Salvar observação
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs text-gray-400">
              <Filter className="size-3.5" />
              Filtro
            </span>
            <button
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${filtroCategoria === "TODAS" ? "border-violet-200 bg-violet-50 text-[#6C5CE7]" : "border-gray-200 bg-white text-gray-500"}`}
              onClick={() => setFiltroCategoria("TODAS")}
            >
              TODAS
            </button>
            {categorias.map((item) => (
              <button
                key={item}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${filtroCategoria === item ? "border-violet-200 bg-violet-50 text-[#6C5CE7]" : "border-gray-200 bg-white text-gray-500"}`}
                onClick={() => setFiltroCategoria(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {observacoesOrdenadas.map((observacao) => (
              <article key={observacao.id} className="rounded-xl border border-gray-200 bg-white p-3">
                <div className="mb-2 flex items-center justify-between">
                  <Badge className={getCategoriaClass(observacao.categoria)}>{observacao.categoria}</Badge>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{new Date(observacao.createdAt).toLocaleString("pt-BR")}</span>
                    <button
                      type="button"
                      onClick={() => void excluirObservacao(observacao.id)}
                      disabled={deletingObservacaoId === observacao.id}
                      className="inline-flex h-7 items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 text-[11px] font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingObservacaoId === observacao.id ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
                      Excluir
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-700">{observacao.texto}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {observacao.fotos.map((fotoItem) =>
                    fotoItem.url ? (
                      <a key={fotoItem.id} href={fotoItem.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-gray-200">
                        <Image src={fotoItem.url} alt="Registro" width={64} height={64} className="size-16 object-cover" />
                      </a>
                    ) : null,
                  )}
                </div>
              </article>
            ))}

            {!observacoesOrdenadas.length && <p className="text-sm text-gray-400">Sem observações neste filtro.</p>}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-2xl text-gray-900">Relatório com IA</CardTitle>
          <CardDescription className="text-gray-500">Disponível com 5+ observações ({observacoes.length} registradas)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input value={periodo} onChange={(event) => setPeriodo(event.target.value)} placeholder="Período" className="border-gray-200 bg-gray-50" />
          <Button onClick={gerarRelatorio} className="w-full bg-[#6C5CE7] text-white hover:bg-[#5a4bd6]">
            <Bot className="mr-2 size-4" />
            Gerar relatório
          </Button>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-500">
            <p className="inline-flex items-center gap-1 font-semibold text-gray-600">
              <ClipboardList className="size-3.5" />
              Progresso
            </p>
            <p className="mt-1">{Math.min(observacoes.length, 5)} de 5 observações mínimas para liberar geração automática.</p>
          </div>

          <div className="space-y-2">
            {relatorios.map((relatorio) => (
              <article key={relatorio.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="inline-flex items-center gap-1 text-xs text-gray-400">
                    <CalendarDays className="size-3.5" />
                    {relatorio.periodo}
                  </p>
                  <button
                    type="button"
                    onClick={() => void excluirRelatorio(relatorio.id)}
                    disabled={deletingRelatorioId === relatorio.id}
                    className="inline-flex h-7 items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 text-[11px] font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deletingRelatorioId === relatorio.id ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
                    Excluir
                  </button>
                </div>
                <p className="mt-1 text-sm text-gray-700">{relatorio.texto}</p>
              </article>
            ))}

            {!relatorios.length && <p className="text-sm text-gray-400">Nenhum relatório gerado ainda.</p>}
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-500">
            <p className="inline-flex items-center gap-1 font-semibold text-gray-600">
              <UserRound className="size-3.5" />
              Perfil em foco
            </p>
            <p className="mt-1">Use esta página para consolidar observações, anexos e relatórios em uma linha do tempo única.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
