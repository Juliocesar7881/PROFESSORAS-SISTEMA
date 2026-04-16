"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Camera, ImagePlus, Loader2, School, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type CategoriaObservacao = "APRENDIZAGEM" | "LINGUAGEM" | "SOCIAL" | "MOTOR" | "CRIATIVIDADE";

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
  categoria: CategoriaObservacao;
  createdAt: string;
  fotos: Array<{
    id: string;
    url: string | null;
  }>;
};

const CATEGORIAS: Array<{ value: CategoriaObservacao; label: string; emoji: string; color: string }> = [
  { value: "APRENDIZAGEM", label: "Aprendizagem", emoji: "📚", color: "border-blue-200 bg-blue-50 text-blue-700" },
  { value: "LINGUAGEM", label: "Linguagem", emoji: "💬", color: "border-amber-200 bg-amber-50 text-amber-700" },
  { value: "SOCIAL", label: "Social", emoji: "🤝", color: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  { value: "MOTOR", label: "Motor", emoji: "🏃", color: "border-pink-200 bg-pink-50 text-pink-700" },
  { value: "CRIATIVIDADE", label: "Criatividade", emoji: "🎨", color: "border-purple-200 bg-purple-50 text-purple-700" },
];

function getObsBadge(cat: string) {
  const n = cat.toLowerCase();
  if (n.includes("aprendizagem")) return "obs-aprendizagem";
  if (n.includes("linguagem")) return "obs-linguagem";
  if (n.includes("social")) return "obs-social";
  if (n.includes("motor")) return "obs-motor";
  if (n.includes("criatividade")) return "obs-criatividade";
  return "border border-gray-200 bg-gray-50 text-gray-500";
}

function formatDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "agora";
  }

  return parsed.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ObservacoesPage() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [observacoes, setObservacoes] = useState<Observacao[]>([]);

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingAlunos, setLoadingAlunos] = useState(false);
  const [loadingObservacoes, setLoadingObservacoes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingObservacaoId, setDeletingObservacaoId] = useState<string | null>(null);

  const [turmaId, setTurmaId] = useState("");
  const [alunoId, setAlunoId] = useState("");
  const [categoria, setCategoria] = useState<CategoriaObservacao>("APRENDIZAGEM");
  const [texto, setTexto] = useState("");
  const [fotos, setFotos] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const selectedAluno = useMemo(() => alunos.find((item) => item.id === alunoId) ?? null, [alunos, alunoId]);

  const loadObservacoes = useCallback(async (targetAlunoId: string) => {
    if (!targetAlunoId) {
      setObservacoes([]);
      return;
    }

    setLoadingObservacoes(true);

    try {
      const response = await fetch(`/api/observacoes?alunoId=${targetAlunoId}`, { cache: "no-store" });
      const json = (await response.json()) as { data?: Observacao[]; error?: { message?: string } };

      if (!response.ok) {
        throw new Error(json.error?.message ?? "Falha ao carregar observações");
      }

      setObservacoes(json.data ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar observações";
      toast.error(message);
      setObservacoes([]);
    } finally {
      setLoadingObservacoes(false);
    }
  }, []);

  const loadAlunos = useCallback(
    async (targetTurmaId: string) => {
      if (!targetTurmaId) {
        setAlunos([]);
        setAlunoId("");
        setObservacoes([]);
        return;
      }

      setLoadingAlunos(true);

      try {
        const response = await fetch(`/api/alunos?turmaId=${targetTurmaId}`, { cache: "no-store" });
        const json = (await response.json()) as { data?: Aluno[]; error?: { message?: string } };

        if (!response.ok) {
          throw new Error(json.error?.message ?? "Falha ao carregar alunos");
        }

        const list = json.data ?? [];
        setAlunos(list);

        const firstAlunoId = list[0]?.id ?? "";
        setAlunoId(firstAlunoId);

        if (firstAlunoId) {
          await loadObservacoes(firstAlunoId);
        } else {
          setObservacoes([]);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha ao carregar alunos";
        toast.error(message);
        setAlunos([]);
        setAlunoId("");
        setObservacoes([]);
      } finally {
        setLoadingAlunos(false);
      }
    },
    [loadObservacoes],
  );

  const loadInitialData = useCallback(async () => {
    setLoadingInitial(true);

    try {
      const response = await fetch("/api/turmas", { cache: "no-store" });
      const json = (await response.json()) as { data?: Turma[]; error?: { message?: string } };

      if (!response.ok) {
        throw new Error(json.error?.message ?? "Falha ao carregar turmas");
      }

      const list = json.data ?? [];
      setTurmas(list);

      const firstTurmaId = list[0]?.id ?? "";
      setTurmaId(firstTurmaId);

      if (firstTurmaId) {
        await loadAlunos(firstTurmaId);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar turmas";
      toast.error(message);
      setTurmas([]);
    } finally {
      setLoadingInitial(false);
    }
  }, [loadAlunos]);

  useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);

  const onTurmaChange = async (value: string) => {
    setTurmaId(value);
    await loadAlunos(value);
  };

  const onAlunoChange = async (value: string) => {
    setAlunoId(value);
    await loadObservacoes(value);
  };

  const onFotosChange = (files: FileList | null) => {
    if (!files) {
      setFotos([]);
      return;
    }

    setFotos(Array.from(files).slice(0, 6));
  };

  useEffect(() => {
    if (!fotos.length) {
      setPreviewUrls([]);
      return;
    }

    const urls = fotos.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [fotos]);

  const salvarObservacao = async () => {
    if (!alunoId) {
      toast.error("Selecione um aluno");
      return;
    }

    if (texto.trim().length < 3) {
      toast.error("Digite pelo menos 3 caracteres na observação");
      return;
    }

    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("alunoId", alunoId);
      formData.append("categoria", categoria);
      formData.append("texto", texto.trim());

      for (const foto of fotos) {
        formData.append("fotos", foto);
      }

      const response = await fetch("/api/observacoes", {
        method: "POST",
        body: formData,
      });

      const json = (await response.json()) as {
        data?: {
          upload?: {
            success?: boolean;
            uploadedCount?: number;
            failedCount?: number;
            message?: string;
          };
        };
        error?: { message?: string };
      };

      if (!response.ok) {
        throw new Error(json.error?.message ?? "Falha ao salvar observação");
      }

      setTexto("");
      setFotos([]);
      const upload = json.data?.upload;
      const failedCount = upload?.failedCount ?? 0;

      if (failedCount > 0) {
        toast.warning(upload?.message ?? "Observação salva, mas houve falha no envio de imagem.");
      } else {
        toast.success(upload?.message ?? "Observação salva com sucesso");
      }

      await loadObservacoes(alunoId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao salvar observação";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const excluirObservacao = async (observacaoId: string) => {
    if (!alunoId) {
      return;
    }

    if (!window.confirm("Deseja excluir esta observação? Esta ação não pode ser desfeita.")) {
      return;
    }

    setDeletingObservacaoId(observacaoId);

    try {
      const response = await fetch(`/api/observacoes/${observacaoId}`, {
        method: "DELETE",
      });

      const json = (await response.json()) as { error?: { message?: string } };

      if (!response.ok) {
        throw new Error(json.error?.message ?? "Falha ao excluir observação");
      }

      setObservacoes((current) => current.filter((item) => item.id !== observacaoId));
      toast.success("Observação excluída com sucesso");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao excluir observação";
      toast.error(message);
    } finally {
      setDeletingObservacaoId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Form Card */}
      <Card className="pf-card rounded-[1.4rem] border-sky-100/80 bg-white">
        <CardHeader className="p-5 pb-3 md:p-7 md:pb-4">
          <CardTitle className="font-heading text-xl text-[#223246]">Nova observação</CardTitle>
          <CardDescription className="text-[13px] font-semibold text-[#6f88a2]">
            Escolha turma e aluno, escreva a anotação e anexe imagens em poucos cliques.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 p-5 pt-0 md:p-7 md:pt-0">
          {loadingInitial ? (
            <div className="flex items-center gap-2.5 rounded-2xl border border-sky-100 bg-sky-50/50 p-4 text-sm font-semibold text-[#6f88a2]">
              <Loader2 className="size-4 animate-spin text-sky-500" />
              Carregando turmas...
            </div>
          ) : (
            <>
              {/* Turma + Aluno selects */}
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="pf-label">
                    <School className="size-3.5 text-sky-500" /> Turma
                  </span>
                  <select
                    value={turmaId}
                    onChange={(event) => void onTurmaChange(event.target.value)}
                    className="pf-select"
                  >
                    {!turmas.length && <option value="">Sem turmas cadastradas</option>}
                    {turmas.map((turma) => (
                      <option key={turma.id} value={turma.id}>
                        {turma.nome} ({turma.faixaEtaria})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="pf-label">
                    <UserRound className="size-3.5 text-teal-500" /> Aluno
                  </span>
                  <select
                    value={alunoId}
                    onChange={(event) => void onAlunoChange(event.target.value)}
                    disabled={!turmaId || loadingAlunos}
                    className="pf-select"
                  >
                    {!alunos.length && <option value="">Sem alunos nesta turma</option>}
                    {alunos.map((aluno) => (
                      <option key={aluno.id} value={aluno.id}>
                        {aluno.nome}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Category pills */}
              <div>
                <p className="pf-label">Categoria</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIAS.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setCategoria(item.value)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-bold transition-all ${
                        categoria === item.value
                          ? `${item.color} ring-2 ring-offset-1`
                          : "border-sky-100 bg-white text-[#6f88a2] hover:border-sky-200 hover:bg-sky-50/50"
                      }`}
                    >
                      <span>{item.emoji}</span>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text area */}
              <Textarea
                value={texto}
                onChange={(event) => setTexto(event.target.value)}
                placeholder="Ex: Hoje a criança participou da roda, interagiu com colegas e mostrou interesse na atividade de pintura."
                className="min-h-32 rounded-2xl border-sky-100 bg-white text-[15px] leading-relaxed placeholder:text-[#a3bdd2] focus:border-sky-300 focus:ring-sky-100"
              />

              {/* Photo upload */}
              <div className="space-y-3">
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed border-sky-200 bg-sky-50/40 p-4 transition-colors hover:border-sky-300 hover:bg-sky-50/70">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-100">
                    <ImagePlus className="size-5 text-sky-600" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#3d5771]">Adicionar fotos</p>
                    <p className="text-xs text-[#8aa2b9]">JPG, PNG ou WEBP • Até 6 imagens</p>
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    capture="environment"
                    onChange={(event) => onFotosChange(event.target.files)}
                    className="sr-only"
                  />
                </label>

                {fotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
                    {fotos.map((file, index) => {
                      const previewUrl = previewUrls[index];

                      if (!previewUrl) {
                        return null;
                      }

                      return (
                        <div key={`${file.name}-${file.size}-${file.lastModified}`} className="overflow-hidden rounded-xl border border-sky-100">
                          <Image
                            src={previewUrl}
                            alt={file.name}
                            width={120}
                            height={120}
                            unoptimized
                            className="size-full h-20 w-full object-cover"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Save button — now prominent and separate */}
              <button
                type="button"
                onClick={() => void salvarObservacao()}
                disabled={saving || !alunoId}
                className="pf-btn-success w-full"
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
                {saving ? "Salvando..." : "Salvar observação"}
              </button>

              <p className="rounded-xl bg-sky-50/60 px-4 py-2.5 text-xs font-medium text-[#6f88a2]">
                💡 Texto salvo no banco da sua conta. Imagens em storage separado por conta (login Google).
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* History Card */}
      <Card className="pf-card rounded-[1.4rem] border-sky-100/80 bg-white">
        <CardHeader className="p-5 pb-3 md:p-7 md:pb-4">
          <CardTitle className="font-heading text-xl text-[#223246]">
            {selectedAluno ? `Histórico de ${selectedAluno.nome}` : "Histórico de observações"}
          </CardTitle>
          <CardDescription className="text-[13px] font-semibold text-[#6f88a2]">
            Linha do tempo simples com textos e imagens do aluno selecionado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 p-5 pt-0 md:p-7 md:pt-0">
          {loadingObservacoes && (
            <div className="flex items-center gap-2.5 rounded-2xl border border-sky-100 bg-sky-50/50 p-4 text-sm font-semibold text-[#6f88a2]">
              <Loader2 className="size-4 animate-spin text-sky-500" />
              Carregando observações...
            </div>
          )}

          {!loadingObservacoes && observacoes.map((observacao) => (
            <article key={observacao.id} className="rounded-2xl border border-sky-100 bg-sky-50/30 p-4">
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${getObsBadge(observacao.categoria)}`}>
                  {observacao.categoria}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[#8aa2b9]">{formatDateTime(observacao.createdAt)}</span>
                  <button
                    type="button"
                    onClick={() => void excluirObservacao(observacao.id)}
                    disabled={deletingObservacaoId === observacao.id}
                    className="inline-flex h-7 items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 text-[11px] font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label="Excluir observação"
                  >
                    {deletingObservacaoId === observacao.id ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
                    Excluir
                  </button>
                </div>
              </div>

              <p className="text-sm leading-relaxed text-[#3d5771]">{observacao.texto}</p>

              {observacao.fotos.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {observacao.fotos.map((fotoItem) =>
                    fotoItem.url ? (
                      <a
                        key={fotoItem.id}
                        href={fotoItem.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block overflow-hidden rounded-xl border border-sky-100"
                      >
                        <Image src={fotoItem.url} alt="Registro da observação" width={84} height={84} className="size-[84px] object-cover" />
                      </a>
                    ) : null,
                  )}
                </div>
              )}
            </article>
          ))}

          {!loadingObservacoes && !observacoes.length && (
            <div className="pf-empty">
              Nenhuma observação para este aluno ainda. Faça o primeiro registro acima! ✍️
            </div>
          )}

          {!turmas.length && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
              Você precisa cadastrar uma turma e um aluno antes de registrar observações.
              <div className="mt-3">
                <Link href="/dashboard/configuracoes" className="font-bold text-amber-900 underline underline-offset-2">
                  Ir para gestão de turmas →
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
