export type PaginatedPayload<T> = {
  items: T[];
  nextCursor: string | null;
  total: number | null;
};

export function getPaginatedPayload<T>(data: unknown): PaginatedPayload<T> {
  if (Array.isArray(data)) {
    return {
      items: data as T[],
      nextCursor: null,
      total: data.length,
    };
  }

  if (data && typeof data === "object" && "items" in data && Array.isArray((data as { items?: unknown }).items)) {
    const payload = data as {
      items: T[];
      nextCursor?: unknown;
      total?: unknown;
    };

    return {
      items: payload.items,
      nextCursor: typeof payload.nextCursor === "string" ? payload.nextCursor : null,
      total: typeof payload.total === "number" ? payload.total : null,
    };
  }

  return {
    items: [],
    nextCursor: null,
    total: null,
  };
}

export function getPayloadItems<T>(data: unknown) {
  return getPaginatedPayload<T>(data).items;
}
