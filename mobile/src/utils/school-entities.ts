export function sortByName<T extends { nome: string }>(items: T[]) {
  return [...items].sort((left, right) => left.nome.localeCompare(right.nome, "pt-BR", { sensitivity: "base" }));
}

export function upsertById<T extends { id: string }>(items: T[], nextItem: T) {
  const found = items.some((item) => item.id === nextItem.id);
  return found ? items.map((item) => item.id === nextItem.id ? nextItem : item) : [...items, nextItem];
}
