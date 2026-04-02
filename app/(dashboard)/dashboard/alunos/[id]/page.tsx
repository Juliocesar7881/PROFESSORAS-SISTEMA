"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Bot, Camera, CalendarDays, ClipboardList, Filter, NotebookPen, UserRound } from "lucide-react";

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

export default function AlunoDetailPage({ params }: { params: { id: string } }) {
  const [aluno, setAluno] = useState<AlunoDetail | null>(null);
  const [observacoes, setObservacoes] = useState<Observacao[]>([]);
  const [relatorios, setRelatorios] = useState<Relatorio[]>([]);
  const [texto, setTexto] = useState("");
  const [categoria, setCategoria] = useState<(typeof categorias)[number]>("APRENDIZAGEM");
  const [foto, setFoto] = useState<File | null>(null);
  const [periodo, setPeriodo] = useState("Bimestre atual");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("TODAS");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
    const [alunoResponse, observacoesResponse, relatoriosResponse] = await Promise.all([
      fetch(`/api/alunos/${params.id}`),
      fetch(`/api/observacoes?alunoId=${params.id}`),
      fetch(`/api/relatorios?alunoId=${params.id}`),
    ]);

    const alunoJson = await alunoResponse.json();
    const observacoesJson = await observacoesResponse.json();
    const relatoriosJson = await relatoriosResponse.json();

    setAluno(alunoJson.data);
    setObservacoes(observacoesJson.data ?? []);
    setRelatorios(relatoriosJson.data ?? []);
  }, [params.id]);

  useEffect(() => {
    void load();
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
        return "bg-slate-100 text-slate-700";
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
    formData.append("alunoId", params.id);

    if (foto) {
      formData.append("foto", foto);
    }

    const response = await fetch("/api/observacoes", {
      method: "POST",
      body: formData,
    });

    const json = await response.json();

    if (!response.ok) {
      toast.error(json.error?.message ?? "Falha ao salvar observação");
      return;
    }

    setTexto("");
    setFoto(null);
    toast.success(json.data?.upload?.message ?? "Observação salva");
    await load();
  };

  const gerarRelatorio = async () => {
    const response = await fetch("/api/relatorios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        alunoId: params.id,
        periodo,
      }),
    });

    const json = await response.json();

    if (!response.ok) {
      toast.error(json.error?.message ?? "Falha na geração do relatório");
      return;
    }

    toast.success("Relatório gerado e salvo");
    await load();
  };

  if (!aluno) {
    return (
      <Card className="glass-card border-[#DCECF8]">
        <CardContent className="py-8 text-[#6A638D]">Carregando aluno...</CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="inline-flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-purple-600 text-sm font-bold text-white">
              {initials}
            </div>
            <div>
              <CardTitle className="font-heading text-3xl text-slate-900">{aluno.nome}</CardTitle>
              <CardDescription className="text-slate-600">{aluno.turma.nome} • {alunoIdade}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-2 inline-flex items-center gap-2 text-sm text-slate-600">
              <NotebookPen className="size-4 text-emerald-600" />
              Nova observação
            </p>
            <Textarea value={texto} onChange={(event) => setTexto(event.target.value)} placeholder="O que você observou hoje?" className="border-slate-200 bg-white" />
            <div className="mt-2 flex flex-wrap gap-2">
              {categorias.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategoria(item)}
                  className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${categoria === item ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/60"}`}
                >
                  {item}
                </button>
              ))}
            </div>
            <Input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(event) => setFoto(event.target.files?.[0] ?? null)}
              className="mt-3 border-slate-200 bg-white"
            />

            {previewUrl && (
              <a href={previewUrl} target="_blank" rel="noreferrer" className="mt-3 block overflow-hidden rounded-xl border border-slate-200">
                <Image src={previewUrl} alt="Pré-visualização" width={960} height={640} unoptimized className="h-40 w-full object-cover" />
              </a>
            )}

            <Button onClick={salvarObservacao} className="mt-3 w-full bg-emerald-600 text-white hover:bg-emerald-700">
              <Camera className="mr-2 size-4" />
              Salvar observação
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
              <Filter className="size-3.5" />
              Filtro
            </span>
            <button
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${filtroCategoria === "TODAS" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-slate-200 bg-white text-slate-600"}`}
              onClick={() => setFiltroCategoria("TODAS")}
            >
              TODAS
            </button>
            {categorias.map((item) => (
              <button
                key={item}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${filtroCategoria === item ? "border-rose-200 bg-rose-50 text-rose-700" : "border-slate-200 bg-white text-slate-600"}`}
                onClick={() => setFiltroCategoria(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {observacoesOrdenadas.map((observacao) => (
              <article key={observacao.id} className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="mb-2 flex items-center justify-between">
                  <Badge className={getCategoriaClass(observacao.categoria)}>{observacao.categoria}</Badge>
                  <span className="text-xs text-slate-500">{new Date(observacao.createdAt).toLocaleString("pt-BR")}</span>
                </div>
                <p className="text-sm text-slate-700">{observacao.texto}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {observacao.fotos.map((fotoItem) =>
                    fotoItem.url ? (
                      <a key={fotoItem.id} href={fotoItem.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-slate-200">
                        <Image src={fotoItem.url} alt="Registro" width={64} height={64} className="size-16 object-cover" />
                      </a>
                    ) : null,
                  )}
                </div>
              </article>
            ))}

            {!observacoesOrdenadas.length && <p className="text-sm text-slate-600">Sem observações neste filtro.</p>}
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-2xl text-slate-900">Relatório com IA</CardTitle>
          <CardDescription className="text-slate-600">Disponível com 5+ observações ({observacoes.length} registradas)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input value={periodo} onChange={(event) => setPeriodo(event.target.value)} placeholder="Período" className="border-slate-200 bg-slate-50" />
          <Button onClick={gerarRelatorio} className="w-full bg-rose-500 text-white hover:bg-rose-600">
            <Bot className="mr-2 size-4" />
            Gerar relatório
          </Button>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            <p className="inline-flex items-center gap-1 font-semibold text-slate-700">
              <ClipboardList className="size-3.5" />
              Progresso
            </p>
            <p className="mt-1">{Math.min(observacoes.length, 5)} de 5 observações mínimas para liberar geração automática.</p>
          </div>

          <div className="space-y-2">
            {relatorios.map((relatorio) => (
              <article key={relatorio.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="inline-flex items-center gap-1 text-xs text-slate-500">
                  <CalendarDays className="size-3.5" />
                  {relatorio.periodo}
                </p>
                <p className="mt-1 text-sm text-slate-700">{relatorio.texto}</p>
              </article>
            ))}

            {!relatorios.length && <p className="text-sm text-slate-600">Nenhum relatório gerado ainda.</p>}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            <p className="inline-flex items-center gap-1 font-semibold text-slate-700">
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
