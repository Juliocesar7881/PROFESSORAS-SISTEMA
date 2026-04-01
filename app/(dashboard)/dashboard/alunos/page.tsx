"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { PlusCircle, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Turma = { id: string; nome: string };
type Aluno = { id: string; nome: string; dataNasc: string; turma: { nome: string } };

export default function AlunosPage() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [nome, setNome] = useState("");
  const [dataNasc, setDataNasc] = useState("");
  const [turmaId, setTurmaId] = useState("");

  const loadData = useCallback(async () => {
    const [turmasResponse, alunosResponse] = await Promise.all([fetch("/api/turmas"), fetch("/api/alunos")]);

    const turmasJson = await turmasResponse.json();
    const alunosJson = await alunosResponse.json();

    setTurmas(turmasJson.data ?? []);
    setAlunos(alunosJson.data ?? []);

    if (turmasJson.data?.length && !turmaId) {
      setTurmaId(turmasJson.data[0].id);
    }
  }, [turmaId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const createAluno = async () => {
    if (!nome || !dataNasc || !turmaId) {
      toast.error("Preencha nome, data de nascimento e turma");
      return;
    }

    const response = await fetch("/api/alunos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome,
        dataNasc,
        turmaId,
      }),
    });

    if (!response.ok) {
      const json = await response.json();
      toast.error(json.error?.message ?? "Nao foi possivel criar o aluno");
      return;
    }

    setNome("");
    setDataNasc("");
    toast.success("Aluno adicionado");
    await loadData();
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <Card className="glass-card border-[#DCECF8]">
        <CardHeader>
          <CardTitle className="font-heading text-2xl text-[#1E1740]">Novo aluno</CardTitle>
          <CardDescription className="text-[#6A638D]">Cadastro rapido para observacao e chamada</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Nome completo" value={nome} onChange={(event) => setNome(event.target.value)} />
          <Input type="date" value={dataNasc} onChange={(event) => setDataNasc(event.target.value)} />
          <select
            className="h-10 w-full rounded-md border border-[#D8E9F8] bg-white px-3 text-sm text-[#1E1740]"
            value={turmaId}
            onChange={(event) => setTurmaId(event.target.value)}
          >
            {turmas.map((turma) => (
              <option key={turma.id} value={turma.id}>
                {turma.nome}
              </option>
            ))}
          </select>
          <Button onClick={createAluno} className="w-full bg-[#0BB8A8] text-white hover:bg-[#0A9F92]">
            <PlusCircle className="mr-2 size-4" />
            Salvar aluno
          </Button>
        </CardContent>
      </Card>

      <Card className="glass-card border-[#DCECF8]">
        <CardHeader>
          <CardTitle className="font-heading text-2xl text-[#1E1740]">Lista da turma</CardTitle>
          <CardDescription className="text-[#6A638D]">Toque no aluno para abrir observacoes e historico</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2">
          {alunos.map((aluno) => (
            <Link
              key={aluno.id}
              href={`/dashboard/alunos/${aluno.id}`}
              className="rounded-xl border border-[#DCECF8] bg-white p-3 transition hover:border-[#BDEEE8] hover:bg-[#F2FCFA]"
            >
              <p className="font-semibold text-[#1E1740]">{aluno.nome}</p>
              <p className="text-xs text-[#746E98]">{aluno.turma.nome}</p>
            </Link>
          ))}

          {!alunos.length && (
            <div className="rounded-xl border border-dashed border-[#CFE2F5] bg-[#F8FBFF] p-4 text-[#6A638D] md:col-span-2">
              <p className="flex items-center gap-2">
                <UsersRound className="size-4" />
                Nenhum aluno cadastrado.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
