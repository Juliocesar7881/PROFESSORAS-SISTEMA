import assert from "node:assert/strict";
import test from "node:test";

import { sortByName, upsertById } from "./school-entities";

test("upsertById insere uma entidade sem duplicar as existentes", () => {
  const result = upsertById([{ id: "1", nome: "Ana" }], { id: "2", nome: "Bia" });

  assert.deepEqual(result, [
    { id: "1", nome: "Ana" },
    { id: "2", nome: "Bia" },
  ]);
});

test("upsertById substitui a entidade confirmada pela API", () => {
  const result = upsertById(
    [{ id: "1", nome: "Maternal" }, { id: "2", nome: "Jardim" }],
    { id: "1", nome: "Maternal II" },
  );

  assert.equal(result.length, 2);
  assert.deepEqual(result[0], { id: "1", nome: "Maternal II" });
});

test("sortByName usa ordenação alfabética em português sem alterar a entrada", () => {
  const input = [{ id: "2", nome: "Érica" }, { id: "1", nome: "Ana" }];
  const result = sortByName(input);

  assert.deepEqual(result.map((item) => item.nome), ["Ana", "Érica"]);
  assert.deepEqual(input.map((item) => item.nome), ["Érica", "Ana"]);
});
