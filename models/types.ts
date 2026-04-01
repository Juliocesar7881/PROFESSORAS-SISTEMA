import type { CategoriaObservacao, Plano } from "@prisma/client";

export type UserPlano = Plano;

export interface SessionPrincipal {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  plano: UserPlano;
}

export interface TurmaModel {
  id: string;
  nome: string;
  faixaEtaria: string;
  ano: number;
  deletedAt: Date | null;
  userId: string;
}

export interface AlunoModel {
  id: string;
  nome: string;
  dataNasc: Date;
  fotoKey: string | null;
  deletedAt: Date | null;
  turmaId: string;
}

export interface ObservacaoModel {
  id: string;
  texto: string;
  categoria: CategoriaObservacao;
  alunoId: string;
  createdAt: Date;
}

export interface PlanejamentoModel {
  id: string;
  semanaInicio: Date;
  semanaFim: Date;
  userId: string;
  turmaId: string;
  shareToken: string | null;
}

export interface ApiSuccess<T> {
  data: T;
  error: null;
}

export interface ApiFailure {
  data: null;
  error: {
    code: string;
    message: string;
    details?: unknown;
    upgradeUrl?: string;
  };
}

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;
