"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Baby, Loader2, Pencil, Plus, RotateCcw, School, Trash2, UsersRound } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ViewportModal } from "@/components/viewport-modal";
import { getPayloadItems } from "@/lib/api-payload";

type Turma = {
  id: string;
  nome: string;
  faixaEtaria?: string | null;
  turno?: string | null;
  instituicao?: string | null;
  ano?: number | null;
  deletedAt?: string | null;
  _count?: { alunos: number };
};
type Crianca = {
  id: string;
  nome: string;
  turmaId: string;
  dataNasc?: string | null;
  contexto?: string | null;
  deletedAt?: string | null;
  turma: { id: string; nome: string };
};

function errorMessage(json: unknown, fallback: string) {
  if (json && typeof json === "object" && "error" in json) {
    return (json as { error?: { message?: string } }).error?.message ?? fallback;
  }
  return fallback;
}

export function GestaoTurmasClient() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [criancas, setCriancas] = useState<Crianca[]>([]);
  const [trashTurmas, setTrashTurmas] = useState<Turma[]>([]);
  const [trashCriancas, setTrashCriancas] = useState<Crianca[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTrash, setShowTrash] = useState(false);
  const [showTurmaForm, setShowTurmaForm] = useState(false);
  const [showCriancaForm, setShowCriancaForm] = useState(false);
  const [editingTurma, setEditingTurma] = useState<Turma | null>(null);
  const [editingCrianca, setEditingCrianca] = useState<Crianca | null>(null);
  const [turmaForm, setTurmaForm] = useState({ nome: "", faixaEtaria: "", turno: "", instituicao: "", ano: String(new Date().getFullYear()) });
  const [criancaForm, setCriancaForm] = useState({ nome: "", turmaId: "", dataNasc: "", contexto: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [activeT, activeC, trashT, trashC] = await Promise.all([
        fetch("/api/turmas", { cache: "no-store" }),
        fetch("/api/criancas?limit=100", { cache: "no-store" }),
        fetch("/api/turmas?lixeira=true", { cache: "no-store" }),
        fetch("/api/criancas?limit=100&lixeira=true", { cache: "no-store" }),
      ]);
      const [activeTJ, activeCJ, trashTJ, trashCJ] = await Promise.all([activeT.json(), activeC.json(), trashT.json(), trashC.json()]);
      if (!activeT.ok || !activeC.ok) throw new Error("Falha ao carregar turmas e criancas");
      setTurmas((activeTJ.data ?? []) as Turma[]);
      setCriancas(getPayloadItems<Crianca>(activeCJ.data));
      setTrashTurmas(trashT.ok ? (trashTJ.data ?? []) as Turma[] : []);
      setTrashCriancas(trashC.ok ? getPayloadItems<Crianca>(trashCJ.data) : []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const childrenByClass = useMemo(() => {
    const map = new Map<string, Crianca[]>();
    criancas.forEach((child) => map.set(child.turmaId, [...(map.get(child.turmaId) ?? []), child]));
    return map;
  }, [criancas]);

  const resetTurma = () => {
    setEditingTurma(null);
    setTurmaForm({ nome: "", faixaEtaria: "", turno: "", instituicao: "", ano: String(new Date().getFullYear()) });
    setShowTurmaForm(false);
  };
  const resetCrianca = () => {
    setEditingCrianca(null);
    setCriancaForm({ nome: "", turmaId: turmas[0]?.id ?? "", dataNasc: "", contexto: "" });
    setShowCriancaForm(false);
  };

  const openTurmaEdit = (turma: Turma) => {
    setEditingTurma(turma);
    setTurmaForm({ nome: turma.nome, faixaEtaria: turma.faixaEtaria ?? "", turno: turma.turno ?? "", instituicao: turma.instituicao ?? "", ano: turma.ano ? String(turma.ano) : "" });
    setShowTurmaForm(true);
  };
  const openCriancaEdit = (crianca: Crianca) => {
    setEditingCrianca(crianca);
    setCriancaForm({ nome: crianca.nome, turmaId: crianca.turmaId, dataNasc: crianca.dataNasc?.slice(0, 10) ?? "", contexto: crianca.contexto ?? "" });
    setShowCriancaForm(true);
  };

  const saveTurma = async () => {
    if (!turmaForm.nome.trim()) return toast.error("Informe o nome da turma.");
    setSaving(true);
    const response = await fetch(editingTurma ? `/api/turmas/${editingTurma.id}` : "/api/turmas", {
      method: editingTurma ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: turmaForm.nome.trim(),
        faixaEtaria: turmaForm.faixaEtaria.trim() || undefined,
        turno: turmaForm.turno.trim() || undefined,
        instituicao: turmaForm.instituicao.trim() || undefined,
        ano: turmaForm.ano ? Number(turmaForm.ano) : undefined,
      }),
    });
    const json = await response.json(); setSaving(false);
    if (!response.ok) return toast.error(errorMessage(json, "Falha ao salvar turma"));
    resetTurma(); await load(); toast.success("Turma salva");
  };

  const saveCrianca = async () => {
    if (!criancaForm.nome.trim() || !criancaForm.turmaId) return toast.error("Informe nome e turma.");
    setSaving(true);
    const response = await fetch(editingCrianca ? `/api/criancas/${editingCrianca.id}` : "/api/criancas", {
      method: editingCrianca ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: criancaForm.nome.trim(),
        turmaId: criancaForm.turmaId,
        dataNasc: criancaForm.dataNasc || undefined,
        contexto: criancaForm.contexto.trim() || undefined,
      }),
    });
    const json = await response.json(); setSaving(false);
    if (!response.ok) return toast.error(errorMessage(json, "Falha ao salvar crianca"));
    resetCrianca(); await load(); toast.success("Crianca salva");
  };

  const remove = async (kind: "turmas" | "criancas", id: string) => {
    if (!window.confirm("Mover para a lixeira por 30 dias?")) return;
    const response = await fetch(`/api/${kind}/${id}`, { method: "DELETE" });
    const json = await response.json();
    if (!response.ok) return toast.error(errorMessage(json, "Falha ao mover para lixeira"));
    await load(); toast.success("Item movido para a lixeira");
  };

  const restore = async (kind: "turmas" | "criancas", id: string) => {
    const response = await fetch(`/api/${kind}/${id}/restore`, { method: "POST" });
    const json = await response.json();
    if (!response.ok) return toast.error(errorMessage(json, "Falha ao restaurar"));
    await load(); toast.success("Item restaurado");
  };

  return <div className="mx-auto max-w-[1300px] space-y-4">
    <div className="flex flex-col gap-3 rounded-xl border border-[#e8e3f0] bg-white p-4 shadow-[0_14px_34px_-30px_rgba(43,35,91,0.24)] transition-[border-color,box-shadow] duration-200 hover:border-[#ddd4f7] hover:shadow-[0_22px_44px_-34px_rgba(43,35,91,0.3)] sm:flex-row sm:items-center sm:justify-between">
      <div><h2 className="font-heading text-xl text-[#17213f]">Organizacao dos registros</h2><p className="mt-1 text-sm text-[#6d6c82]">{turmas.length} turma(s) e {criancas.length} crianca(s)</p></div>
      <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={() => setShowTrash((value) => !value)}><Trash2 className="size-4" /> {showTrash ? "Voltar" : "Lixeira"}</Button><Button type="button" variant="outline" onClick={() => { setTurmaForm({ ...turmaForm, nome: "" }); setEditingTurma(null); setShowTurmaForm(true); }}><School className="size-4" /> Nova turma</Button><Button type="button" onClick={() => { setCriancaForm({ ...criancaForm, turmaId: criancaForm.turmaId || turmas[0]?.id || "" }); setEditingCrianca(null); setShowCriancaForm(true); }} disabled={!turmas.length}><Baby className="size-4" /> Nova crianca</Button></div>
    </div>

    {loading ? <div className="grid min-h-48 place-items-center rounded-lg border border-[#e8e3f0] bg-white"><Loader2 className="size-6 animate-spin text-[#6757c8]" /></div> : showTrash ? <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-lg border border-[#e8e3f0] bg-white p-4"><h3 className="flex items-center gap-2 font-heading text-lg text-[#17213f]"><School className="size-5 text-[#6757c8]" /> Turmas na lixeira</h3><div className="mt-3 space-y-2">{trashTurmas.map((item) => <div key={item.id} className="flex items-center justify-between rounded-md border border-[#f0e4ea] p-3"><span className="font-bold text-[#17213f]">{item.nome}</span><Button type="button" variant="outline" className="h-9" onClick={() => restore("turmas", item.id)}><RotateCcw className="size-4" /> Restaurar</Button></div>)}{!trashTurmas.length ? <p className="py-8 text-center text-sm text-[#6d6c82]">Lixeira vazia.</p> : null}</div></section>
      <section className="rounded-lg border border-[#e8e3f0] bg-white p-4"><h3 className="flex items-center gap-2 font-heading text-lg text-[#17213f]"><Baby className="size-5 text-[#6757c8]" /> Criancas na lixeira</h3><div className="mt-3 space-y-2">{trashCriancas.map((item) => <div key={item.id} className="flex items-center justify-between rounded-md border border-[#f0e4ea] p-3"><div><p className="font-bold text-[#17213f]">{item.nome}</p><p className="text-xs text-[#6d6c82]">{item.turma.nome}</p></div><Button type="button" variant="outline" className="h-9" onClick={() => restore("criancas", item.id)}><RotateCcw className="size-4" /> Restaurar</Button></div>)}{!trashCriancas.length ? <p className="py-8 text-center text-sm text-[#6d6c82]">Lixeira vazia.</p> : null}</div></section>
    </div> : !turmas.length ? <div className="rounded-lg border border-dashed border-[#dcd3f7] bg-white py-16 text-center"><School className="mx-auto size-9 text-[#b7798e]" /><h3 className="mt-3 font-heading text-lg text-[#17213f]">Cadastre a primeira turma</h3><Button className="mt-4" onClick={() => setShowTurmaForm(true)}><Plus className="size-4" /> Nova turma</Button></div> : <div className="space-y-4">
      {turmas.map((turma) => <section key={turma.id} className="rounded-xl border border-[#e8e3f0] bg-white shadow-[0_14px_34px_-30px_rgba(43,35,91,0.2)] transition-[transform,border-color,box-shadow] duration-200 motion-safe:hover:-translate-y-0.5 hover:border-[#ddd4f7] hover:shadow-[0_24px_48px_-34px_rgba(43,35,91,0.3)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e8e3f0] px-4 py-3"><div className="flex items-center gap-3"><span className="inline-flex size-9 items-center justify-center rounded-md bg-[#f3f0ff] text-[#6757c8]"><UsersRound className="size-5" /></span><div><h3 className="font-heading text-lg text-[#17213f]">{turma.nome}</h3><p className="text-xs text-[#6d6c82]">{[turma.faixaEtaria, turma.turno, turma.instituicao, turma.ano].filter(Boolean).join(" | ") || "Sem detalhes adicionais"}</p></div></div><div className="flex gap-1"><Button variant="ghost" className="h-9" onClick={() => openTurmaEdit(turma)}><Pencil className="size-4" /> Editar</Button><Button variant="ghost" className="h-9 text-red-600 hover:bg-red-50" onClick={() => remove("turmas", turma.id)}><Trash2 className="size-4" /></Button></div></div>
        <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">{(childrenByClass.get(turma.id) ?? []).map((child) => <article key={child.id} className="flex items-center justify-between gap-2 rounded-lg border border-[#e8e3f0] bg-[#ffffff] p-3 transition-[transform,border-color,box-shadow] duration-200 motion-safe:hover:-translate-y-0.5 hover:border-[#d8cff2] hover:shadow-sm"><div className="min-w-0"><p className="truncate font-bold text-[#17213f]">{child.nome}</p><p className="truncate text-xs text-[#6d6c82]">{child.contexto || (child.dataNasc ? `Nascimento: ${new Date(child.dataNasc).toLocaleDateString("pt-BR")}` : "Sem contexto adicional")}</p></div><div className="flex shrink-0"><button type="button" onClick={() => openCriancaEdit(child)} className="inline-flex size-8 items-center justify-center rounded-md text-[#6757c8] transition hover:bg-[#f3f0ff]" aria-label="Editar crianca"><Pencil className="size-4" /></button><button type="button" onClick={() => remove("criancas", child.id)} className="inline-flex size-8 items-center justify-center rounded-md text-red-600 transition hover:bg-red-50" aria-label="Mover crianca para lixeira"><Trash2 className="size-4" /></button></div></article>)}<button type="button" onClick={() => { setCriancaForm({ nome: "", turmaId: turma.id, dataNasc: "", contexto: "" }); setEditingCrianca(null); setShowCriancaForm(true); }} className="flex min-h-16 items-center justify-center gap-2 rounded-lg border border-dashed border-[#dcd3f7] text-sm font-bold text-[#6757c8] transition-[transform,border-color,background-color] duration-200 motion-safe:hover:-translate-y-0.5 hover:border-[#a995ec] hover:bg-[#f8f6ff]"><Plus className="size-4" /> Adicionar crianca</button></div>
      </section>)}
    </div>}

    <ViewportModal
      open={showTurmaForm}
      title={editingTurma ? "Editar turma" : "Nova turma"}
      description="O nome e suficiente. Os demais dados ajudam a organizar os registros."
      onClose={resetTurma}
      footer={(
        <>
          <Button type="button" variant="outline" onClick={resetTurma}>Cancelar</Button>
          <Button type="button" onClick={() => void saveTurma()} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            Salvar turma
          </Button>
        </>
      )}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="pf-label">Nome da turma *</span>
          <input className="pf-input h-11" value={turmaForm.nome} onChange={(event) => setTurmaForm({ ...turmaForm, nome: event.target.value })} autoFocus />
        </label>
        <label>
          <span className="pf-label">Etapa / faixa etaria</span>
          <input className="pf-input h-11" value={turmaForm.faixaEtaria} onChange={(event) => setTurmaForm({ ...turmaForm, faixaEtaria: event.target.value })} />
        </label>
        <label>
          <span className="pf-label">Turno</span>
          <input className="pf-input h-11" value={turmaForm.turno} onChange={(event) => setTurmaForm({ ...turmaForm, turno: event.target.value })} />
        </label>
        <label>
          <span className="pf-label">Instituicao</span>
          <input className="pf-input h-11" value={turmaForm.instituicao} onChange={(event) => setTurmaForm({ ...turmaForm, instituicao: event.target.value })} />
        </label>
        <label>
          <span className="pf-label">Ano</span>
          <input type="number" className="pf-input h-11" value={turmaForm.ano} onChange={(event) => setTurmaForm({ ...turmaForm, ano: event.target.value })} />
        </label>
      </div>
    </ViewportModal>

    <ViewportModal
      open={showCriancaForm}
      title={editingCrianca ? "Editar crianca" : "Nova crianca"}
      description="Vincule a crianca a uma turma para manter os registros organizados."
      onClose={resetCrianca}
      footer={(
        <>
          <Button type="button" variant="outline" onClick={resetCrianca}>Cancelar</Button>
          <Button type="button" onClick={() => void saveCrianca()} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            Salvar crianca
          </Button>
        </>
      )}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="pf-label">Nome *</span>
          <input className="pf-input h-11" value={criancaForm.nome} onChange={(event) => setCriancaForm({ ...criancaForm, nome: event.target.value })} autoFocus />
        </label>
        <label>
          <span className="pf-label">Turma *</span>
          <select className="pf-select h-11" value={criancaForm.turmaId} onChange={(event) => setCriancaForm({ ...criancaForm, turmaId: event.target.value })}>
            <option value="">Selecione</option>
            {turmas.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
          </select>
        </label>
        <label>
          <span className="pf-label">Nascimento</span>
          <input type="date" className="pf-input h-11" value={criancaForm.dataNasc} onChange={(event) => setCriancaForm({ ...criancaForm, dataNasc: event.target.value })} />
        </label>
        <label className="sm:col-span-2">
          <span className="pf-label">Contexto</span>
          <Textarea rows={4} value={criancaForm.contexto} onChange={(event) => setCriancaForm({ ...criancaForm, contexto: event.target.value })} />
        </label>
      </div>
    </ViewportModal>
  </div>;
}
