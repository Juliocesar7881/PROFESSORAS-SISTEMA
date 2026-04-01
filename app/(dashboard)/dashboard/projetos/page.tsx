"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Bookmark, Crown, Search } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Projeto = {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  faixaEtaria: string;
  duracao: string;
  premium: boolean;
  salvosPor?: Array<{ userId: string }>;
};

export default function ProjetosPage() {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("TODAS");

  const load = useCallback(async () => {
    const params = new URLSearchParams();

    if (busca) {
      params.set("busca", busca);
    }

    if (categoria !== "TODAS") {
      params.set("categoria", categoria);
    }

    const response = await fetch(`/api/projetos?${params.toString()}`);
    const json = await response.json();
    setProjetos(json.data ?? []);
  }, [busca, categoria]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleSave = async (projeto: Projeto) => {
    const isSaved = Boolean(projeto.salvosPor?.length);
    const response = await fetch("/api/projetos", {
      method: isSaved ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projetoId: projeto.id }),
    });

    if (!response.ok) {
      toast.error("Nao foi possivel atualizar projeto salvo");
      return;
    }

    toast.success(isSaved ? "Projeto removido dos salvos" : "Projeto salvo");
    await load();
  };

  const categorias = ["TODAS", ...Array.from(new Set(projetos.map((item) => item.categoria)))];

  return (
    <div className="space-y-4">
      <Card className="glass-card border-[#DCECF8]">
        <CardHeader>
          <CardTitle className="font-heading text-3xl text-[#1E1740]">Biblioteca de Projetos</CardTitle>
          <CardDescription className="text-[#6A638D]">Natureza, Corpo, Arte, Matematica, Linguagem e muito mais</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-[#8A84AD]" />
            <Input className="pl-9" value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Buscar por titulo ou descricao" />
          </div>

          <div className="flex flex-wrap gap-2">
            {categorias.map((item) => (
              <button
                key={item}
                type="button"
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${categoria === item ? "border-[#BDEEE8] bg-[#E8FBF8] text-[#0F8F83]" : "border-[#DCECF8] bg-white text-[#6A638D] hover:border-[#BDEEE8] hover:bg-[#F2FCFA]"}`}
                onClick={() => setCategoria(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {projetos.map((projeto) => {
          const saved = Boolean(projeto.salvosPor?.length);

          return (
            <article key={projeto.id} className="glass-card rounded-2xl border border-[#DCECF8] p-4 transition hover:-translate-y-0.5 hover:border-[#BDEEE8] hover:bg-[#F2FCFA]">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#7C759E]">{projeto.categoria}</p>
                {projeto.premium ? <Crown className="size-4 text-[#E1A11E]" /> : <Bookmark className="size-4 text-[#8A84AD]" />}
              </div>

              <h2 className="mt-1 font-heading text-2xl text-[#1E1740]">{projeto.titulo}</h2>
              <p className="mt-2 line-clamp-3 text-sm text-[#50497A]">{projeto.descricao}</p>
              <p className="mt-2 text-xs text-[#7A739E]">{projeto.faixaEtaria} • {projeto.duracao}</p>

              <div className="mt-4 flex gap-2">
                <Link href={`/dashboard/projetos/${projeto.id}`} className={buttonVariants({ className: "bg-[#0BB8A8] text-white hover:bg-[#0A9F92]" })}>
                  Usar no planejamento
                </Link>
                <Button variant="outline" className="border-[#D8E9F8] bg-white text-[#1E1740] hover:border-[#BDEEE8] hover:bg-[#F2FCFA]" onClick={() => toggleSave(projeto)}>
                  {saved ? "Remover" : "Salvar"}
                </Button>
              </div>

              {projeto.premium && <p className="mt-2 text-xs font-semibold text-[#E1A11E]">Projeto premium</p>}
            </article>
          );
        })}

        {!projetos.length && (
          <div className="rounded-2xl border border-dashed border-[#CFE2F5] bg-[#F8FBFF] p-5 text-sm text-[#6A638D] md:col-span-2 xl:col-span-3">
            Nenhum projeto encontrado para os filtros atuais.
          </div>
        )}
      </div>
    </div>
  );
}
