import assert from "node:assert/strict";
import test from "node:test";

import type { Registro } from "../types";
import { filterCachedRecords } from "./records";

const records: Registro[] = [
  {
    id: "r1",
    texto: "Explorou tintas e novas cores",
    alunoId: "a1",
    dataRegistro: "2026-07-20",
    createdAt: "2026-07-20T12:00:00.000Z",
    updatedAt: "2026-07-20T12:00:00.000Z",
    fotos: [],
    aluno: { id: "a1", nome: "Ana", turmaId: "t1", turma: { id: "t1", nome: "Maternal" } },
  },
  {
    id: "r2",
    texto: "Participou da roda de leitura",
    alunoId: "a2",
    dataRegistro: "2026-07-10",
    createdAt: "2026-07-10T12:00:00.000Z",
    updatedAt: "2026-07-10T12:00:00.000Z",
    deletedAt: "2026-07-21T12:00:00.000Z",
    fotos: [],
    aluno: { id: "a2", nome: "Bia", turmaId: "t2", turma: { id: "t2", nome: "Jardim" } },
  },
];

test("filters cached records by text, child, date and trash", () => {
  assert.deepEqual(filterCachedRecords(records, { query: "tintas" }).map((item) => item.id), ["r1"]);
  assert.deepEqual(filterCachedRecords(records, { alunoId: "a1" }).map((item) => item.id), ["r1"]);
  assert.deepEqual(filterCachedRecords(records, { dataInicio: "2026-07-15" }).map((item) => item.id), ["r1"]);
  assert.deepEqual(filterCachedRecords(records, { lixeira: true }).map((item) => item.id), ["r2"]);
});
