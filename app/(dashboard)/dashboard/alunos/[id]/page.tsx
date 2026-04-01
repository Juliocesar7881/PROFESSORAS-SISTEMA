"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Bot, Camera, Filter, NotebookPen } from "lucide-react";

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

  const salvarObservacao = async () => {
    if (!texto.trim()) {
      toast.error("Digite uma observacao antes de salvar");
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
      toast.error(json.error?.message ?? "Falha ao salvar observacao");
      return;
    }

    setTexto("");
    setFoto(null);
    toast.success(json.data?.upload?.message ?? "Observacao salva");
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
      toast.error(json.error?.message ?? "Falha na geracao do relatorio");
      return;
    }

    toast.success("Relatorio gerado e salvo");
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
      <Card className="glass-card border-[#DCECF8]">
        <CardHeader>
          <CardTitle className="font-heading text-3xl text-[#1E1740]">{aluno.nome}</CardTitle>
          <CardDescription className="text-[#6A638D]">{aluno.turma.nome}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-[#DCECF8] bg-[#F8FBFF] p-4">
            <p className="mb-2 inline-flex items-center gap-2 text-sm text-[#6A638D]">
              <NotebookPen className="size-4 text-[#0BB8A8]" />
              Nova observacao
            </p>
            <Textarea value={texto} onChange={(event) => setTexto(event.target.value)} placeholder="O que voce observou hoje?" />
            <div className="mt-2 flex flex-wrap gap-2">
              {categorias.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategoria(item)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${categoria === item ? "border-[#BDEEE8] bg-[#E8FBF8] text-[#0F8F83]" : "border-[#DCECF8] bg-white text-[#6A638D] hover:border-[#BDEEE8] hover:bg-[#F2FCFA]"}`}
                >
                  {item}
                </button>
              ))}
            </div>
            <Input
              className="mt-3"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(event) => setFoto(event.target.files?.[0] ?? null)}
            />
            <Button onClick={salvarObservacao} className="mt-3 w-full bg-[#0BB8A8] text-white hover:bg-[#0A9F92]">
              <Camera className="mr-2 size-4" />
              Salvar observacao
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs text-[#7A739E]">
              <Filter className="size-3.5" />
              Filtro
            </span>
            <button
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${filtroCategoria === "TODAS" ? "border-[#FFD4CA] bg-[#FFEEE9] text-[#CB5A43]" : "border-[#DCECF8] bg-white text-[#6A638D]"}`}
              onClick={() => setFiltroCategoria("TODAS")}
            >
              TODAS
            </button>
            {categorias.map((item) => (
              <button
                key={item}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${filtroCategoria === item ? "border-[#FFD4CA] bg-[#FFEEE9] text-[#CB5A43]" : "border-[#DCECF8] bg-white text-[#6A638D]"}`}
                onClick={() => setFiltroCategoria(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {observacoesFiltradas.map((observacao) => (
              <article key={observacao.id} className="rounded-xl border border-[#DCECF8] bg-white p-3">
                <div className="mb-2 flex items-center justify-between">
                  <Badge variant="secondary">{observacao.categoria}</Badge>
                  <span className="text-xs text-[#7A739E]">{new Date(observacao.createdAt).toLocaleString("pt-BR")}</span>
                </div>
                <p className="text-sm text-[#4E4770]">{observacao.texto}</p>
                <div className="mt-2 flex gap-2">
                  {observacao.fotos.map((fotoItem) =>
                    fotoItem.url ? (
                      <a key={fotoItem.id} href={fotoItem.url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[#0BB8A8] underline">
                        Foto anexada
                      </a>
                    ) : null,
                  )}
                </div>
              </article>
            ))}

            {!observacoesFiltradas.length && <p className="text-sm text-[#6A638D]">Sem observacoes neste filtro.</p>}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-[#DCECF8]">
        <CardHeader>
          <CardTitle className="font-heading text-2xl text-[#1E1740]">Relatorio IA</CardTitle>
          <CardDescription className="text-[#6A638D]">Disponivel com 5+ observacoes ({observacoes.length} registradas)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input value={periodo} onChange={(event) => setPeriodo(event.target.value)} placeholder="Periodo" />
          <Button onClick={gerarRelatorio} className="w-full bg-[#0BB8A8] text-white hover:bg-[#0A9F92]">
            <Bot className="mr-2 size-4" />
            Gerar relatorio
          </Button>

          <div className="space-y-2">
            {relatorios.map((relatorio) => (
              <article key={relatorio.id} className="rounded-xl border border-[#DCECF8] bg-[#F8FBFF] p-3">
                <p className="text-xs text-[#7A739E]">{relatorio.periodo}</p>
                <p className="mt-1 text-sm text-[#4E4770]">{relatorio.texto}</p>
              </article>
            ))}

            {!relatorios.length && <p className="text-sm text-[#6A638D]">Nenhum relatorio gerado ainda.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
