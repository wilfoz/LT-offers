/**
 * Contratos do catálogo de tipos de fundação (origem DB_FUN) trocados entre
 * api e web. A aplicação pertence à identidade do tipo e não muda entre
 * versões. A composição são contagens inteiras ≥ 0 por elemento de fundação
 * (17 elementos da planilha); null significa "não informado", distinto de
 * zero (RNF-09).
 */

export const FOUNDATION_APPLICATIONS = [
  'SELF_SUPPORTING',
  'GUYED',
  'CROSS_ROPE',
] as const;
export type FoundationApplication = (typeof FOUNDATION_APPLICATIONS)[number];

/**
 * Campos de contagem por elemento, na ordem das colunas da DB_FUN — a ordem
 * é reusada por api (pendências) e web (formulário).
 */
export const FOUNDATION_ELEMENT_COUNT_FIELDS = [
  'spreadFootingCount',
  'precastMastCount',
  'precastGuyCount',
  'straightPierCount',
  'belledPierCount',
  'slabPierCount',
  'straightPierGuyCount',
  'belledPierGuyCount',
  'rockAnchorCount',
  'concretePileCount',
  'steelPileCount',
  'helicalMastCount',
  'helicalGuyCount',
  'triconeCount',
  'rootPileCount',
  'micropileCount',
  'continuousAugerPileCount',
] as const;
export type FoundationElementCountField =
  (typeof FOUNDATION_ELEMENT_COUNT_FIELDS)[number];

export type FoundationElementCounts = {
  [K in FoundationElementCountField]: number | null;
};

export interface FoundationTypeVersion extends FoundationElementCounts {
  id: number;
  description: string | null;
  effectiveFrom: string;
  createdBy: string;
  createdAt: string;
}

export interface FoundationTypeSummary {
  id: number;
  code: string;
  application: FoundationApplication;
  effectiveVersion: FoundationTypeVersion | null;
  pendingFields: string[];
}

export interface FoundationTypeHistory {
  id: number;
  code: string;
  application: FoundationApplication;
  versions: FoundationTypeVersion[];
}

export interface FoundationTypeVersionInput extends Partial<FoundationElementCounts> {
  description?: string | null;
  effectiveFrom?: string;
}

/** Nova versão de item existente: a data de vigência é obrigatória. */
export interface NewFoundationTypeVersionInput extends FoundationTypeVersionInput {
  effectiveFrom: string;
}

export interface NewFoundationTypeInput extends FoundationTypeVersionInput {
  code: string;
  application: FoundationApplication;
}
