"use client";

import { useMemo, useState } from "react";
import {
  ArrowUp,
  FileUp,
  MessageCircle,
  Search,
  Send,
  Sparkles,
  Tag,
} from "lucide-react";

import { cn } from "@/lib/utils";

type Categoria = "Dúvidas" | "Ideias" | "Desabafos" | "Materiais";

type Post = {
  id: string;
  autor: string;
  turma: string;
  categoria: Categoria;
  texto: string;
  upvotes: number;
  comentarios: number;
  criadoEm: string;
};

const initialPosts: Post[] = [
  {
    id: "p1",
    autor: "Ana Paula",
    turma: "Maternal II",
    categoria: "Dúvidas",
    texto:
      "Alguém tem uma dinâmica curta para acolhida de segunda-feira que funcione bem com crianças mais agitadas?",
    upvotes: 14,
    comentarios: 6,
    criadoEm: "Hoje, 08:20",
  },
  {
    id: "p2",
    autor: "Renata M.",
    turma: "Pré I",
    categoria: "Materiais",
    texto:
      "Compartilhei um kit de fichas de coordenação motora com recorte e traçado. Se quiserem, mando o arquivo no chat da escola.",
    upvotes: 22,
    comentarios: 9,
    criadoEm: "Hoje, 07:45",
  },
  {
    id: "p3",
    autor: "Juliana C.",
    turma: "Berçário",
    categoria: "Desabafos",
    texto:
      "Semana puxada por aqui. O que vocês fazem para registrar observações rápidas sem perder o fio da rotina?",
    upvotes: 11,
    comentarios: 12,
    criadoEm: "Ontem, 18:02",
  },
  {
    id: "p4",
    autor: "Carla Dias",
    turma: "Pré II",
    categoria: "Ideias",
    texto:
      "Projeto da semana: jardim sensorial com materiais recicláveis. As crianças amaram o momento de exploração livre.",
    upvotes: 31,
    comentarios: 15,
    criadoEm: "Ontem, 14:30",
  },
];

const categorias: Array<Categoria | "Todas"> = [
  "Todas",
  "Dúvidas",
  "Ideias",
  "Desabafos",
  "Materiais",
];

const categoriaColor: Record<Categoria, string> = {
  Dúvidas: "border-sky-200 bg-sky-50 text-sky-700",
  Ideias: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Desabafos: "border-rose-200 bg-rose-50 text-rose-700",
  Materiais: "border-amber-200 bg-amber-50 text-amber-700",
};

export default function ComunidadePage() {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [filtro, setFiltro] = useState<Categoria | "Todas">("Todas");
  const [busca, setBusca] = useState("");
  const [novoTexto, setNovoTexto] = useState("");
  const [novaCategoria, setNovaCategoria] = useState<Categoria>("Dúvidas");
  const [arquivoNome, setArquivoNome] = useState("");

  const postsFiltrados = useMemo(() => {
    const query = busca.trim().toLowerCase();

    return posts.filter((post) => {
      if (filtro !== "Todas" && post.categoria !== filtro) return false;
      if (!query) return true;
      return `${post.texto} ${post.autor} ${post.turma}`.toLowerCase().includes(query);
    });
  }, [posts, filtro, busca]);

  const handleUpvote = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              upvotes: post.upvotes + 1,
            }
          : post
      )
    );
  };

  const handleCreatePost = () => {
    const texto = novoTexto.trim();
    if (!texto) return;

    const novoPost: Post = {
      id: `p-${Date.now()}`,
      autor: "Você",
      turma: "Minha turma",
      categoria: novaCategoria,
      texto: arquivoNome ? `${texto}\n\n📎 Arquivo: ${arquivoNome}` : texto,
      upvotes: 0,
      comentarios: 0,
      criadoEm: "Agora",
    };

    setPosts((prev) => [novoPost, ...prev]);
    setNovoTexto("");
    setArquivoNome("");
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <section className="pf-card rounded-3xl border border-sky-100/80 bg-white p-6 md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <span className="pf-chip border-sky-200 bg-sky-50 text-sky-700">
              <Sparkles className="size-3.5" />
              Comunidade de professoras
            </span>
            <h2 className="mt-2 font-heading text-3xl text-[#223246] md:text-4xl">
              Feed limpo para trocar ideias reais
            </h2>
            <p className="mt-1 text-sm font-semibold text-[#5f7790] md:text-base">
              Pergunte, compartilhe materiais e vote nas respostas que realmente ajudam no dia a dia.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_1.9fr]">
        <div className="space-y-5">
          <div className="pf-card rounded-3xl border border-sky-100/80 bg-white p-4">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#86a0b8]">Nova publicação</p>

            <textarea
              value={novoTexto}
              onChange={(event) => setNovoTexto(event.target.value)}
              placeholder="Compartilhe sua dúvida, ideia ou material..."
              className="min-h-[120px] w-full rounded-xl border border-sky-100 bg-sky-50/30 p-3 text-sm font-semibold text-[#2d465e] placeholder:text-[#95adc2] focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />

            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
              <select
                value={novaCategoria}
                onChange={(event) => setNovaCategoria(event.target.value as Categoria)}
                className="h-10 rounded-xl border border-sky-100 bg-white px-3 text-sm font-bold text-[#2d465e] focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100"
              >
                <option value="Dúvidas">Dúvidas</option>
                <option value="Ideias">Ideias</option>
                <option value="Desabafos">Desabafos</option>
                <option value="Materiais">Materiais</option>
              </select>

              <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 text-xs font-black uppercase tracking-[0.1em] text-sky-700">
                <FileUp className="size-3.5" />
                Anexar
                <input
                  type="file"
                  className="hidden"
                  onChange={(event) => setArquivoNome(event.target.files?.[0]?.name ?? "")}
                />
              </label>
            </div>

            {arquivoNome && (
              <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">
                Arquivo selecionado: {arquivoNome}
              </p>
            )}

            <button
              type="button"
              onClick={handleCreatePost}
              className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-teal-500 text-sm font-extrabold text-white shadow-[0_16px_28px_-18px_rgba(76,164,237,0.95)] transition hover:-translate-y-0.5"
            >
              <Send className="size-4" />
              Publicar
            </button>
          </div>

          <div className="pf-card rounded-3xl border border-sky-100/80 bg-white p-4">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#86a0b8]">Categorias</p>
            <div className="flex flex-wrap gap-2">
              {categorias.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFiltro(item)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] transition",
                    filtro === item
                      ? "border-sky-300 bg-sky-100 text-sky-700"
                      : "border-sky-100 bg-white text-[#86a0b8] hover:border-sky-200 hover:text-[#35536f]"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="pf-card rounded-3xl border border-sky-100/80 bg-white p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-[#86a0b8]" />
              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar por assunto, autora ou turma..."
                className="h-11 w-full rounded-xl border border-sky-100 bg-white pl-10 pr-3 text-sm font-semibold text-[#2d465e] placeholder:text-[#95adc2] focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
            </div>
          </div>

          {postsFiltrados.map((post) => (
            <article key={post.id} className="pf-card pf-card-hover rounded-3xl border border-sky-100/80 bg-white p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-heading text-2xl leading-none text-[#223246]">{post.autor}</p>
                  <p className="mt-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#86a0b8]">
                    {post.turma} • {post.criadoEm}
                  </p>
                </div>
                <span className={cn("inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em]", categoriaColor[post.categoria])}>
                  <Tag className="size-3.5" />
                  {post.categoria}
                </span>
              </div>

              <p className="text-sm font-semibold leading-relaxed text-[#44617b]">{post.texto}</p>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleUpvote(post.id)}
                  className="inline-flex items-center gap-1 rounded-xl border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 transition hover:bg-sky-100"
                >
                  <ArrowUp className="size-3.5" />
                  {post.upvotes}
                </button>
                <span className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-bold text-[#6f88a2]">
                  <MessageCircle className="size-3.5" />
                  {post.comentarios}
                </span>
              </div>
            </article>
          ))}

          {!postsFiltrados.length && (
            <p className="rounded-2xl border border-dashed border-sky-200 bg-white p-4 text-sm font-semibold text-[#6f88a2]">
              Nenhuma publicação encontrada com esse filtro.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
