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
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-2xl text-slate-900">Novo aluno</CardTitle>
          <CardDescription>Cadastro rapido para observacao, chamada e relatorio.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input className="border-slate-200 bg-slate-50" placeholder="Nome completo" value={nome} onChange={(event) => setNome(event.target.value)} />
          <Input className="border-slate-200 bg-slate-50" type="date" value={dataNasc} onChange={(event) => setDataNasc(event.target.value)} />
          <select
            className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800"
            value={turmaId}
            onChange={(event) => setTurmaId(event.target.value)}
          >
            {turmas.map((turma) => (
              <option key={turma.id} value={turma.id}>
                {turma.nome}
              </option>
            ))}
          </select>
          <Button onClick={createAluno} className="w-full bg-rose-500 text-white hover:bg-rose-600">
            <PlusCircle className="mr-2 size-4" />
            Salvar aluno
          </Button>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-2xl text-slate-900">Lista da turma</CardTitle>
          <CardDescription>Toque no aluno para abrir observacoes, historico e avaliacao.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {alunos.map((aluno) => (
            <Link
              key={aluno.id}
              href={`/dashboard/alunos/${aluno.id}`}
              className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 transition hover:border-rose-200 hover:bg-rose-50/30"
            >
              <p className="font-semibold text-slate-900">{aluno.nome}</p>
              <p className="text-xs text-slate-500">{aluno.turma.nome}</p>
            </Link>
          ))}

          {!alunos.length && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-slate-600 md:col-span-2 xl:col-span-3">
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
