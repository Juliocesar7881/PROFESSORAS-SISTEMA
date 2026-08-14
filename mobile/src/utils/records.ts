import type { Registro } from "../types";

export type CachedRecordFilters = {
  turmaId?: string;
  alunoId?: string;
  dataInicio?: string;
  dataFim?: string;
  query?: string;
  lixeira?: boolean;
};

export function filterCachedRecords(records: Registro[], filters: CachedRecordFilters) {
  const query = filters.query?.trim().toLocaleLowerCase("pt-BR") || "";
  return records.filter((record) => {
    if (Boolean(record.deletedAt) !== Boolean(filters.lixeira)) return false;
    if (filters.turmaId && record.aluno.turmaId !== filters.turmaId) return false;
    if (filters.alunoId && record.alunoId !== filters.alunoId) return false;
    const day = record.dataRegistro.slice(0, 10);
    if (filters.dataInicio && day < filters.dataInicio) return false;
    if (filters.dataFim && day > filters.dataFim) return false;
    if (query && !`${record.texto} ${record.aluno.nome} ${record.aluno.turma.nome}`.toLocaleLowerCase("pt-BR").includes(query)) return false;
    return true;
  });
}
