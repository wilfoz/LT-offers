/**
 * Contratos do catálogo de custos fixos e indiretos (DB_FI) trocados entre
 * api e web. Valores monetários trafegam como string formatada (RNF-08).
 * null significa "não informado", distinto de "0" (RNF-09).
 */

export const FIXED_COST_CATEGORIES = [
  'EPI',
  'MEDICAL_EXAM',
  'UNIFORM',
  'MOB_DEMOB',
  'TRAVEL_HOUSING',
  'OTHER',
] as const;

export type FixedCostCategory = (typeof FIXED_COST_CATEGORIES)[number];

export interface FixedCostVersion {
  id: number;
  unitCost: string | null;
  unit: string | null;
  effectiveFrom: string;
  createdBy: string;
  createdAt: string;
}

export interface FixedCostSummary {
  id: number;
  code: string;
  description: string;
  category: FixedCostCategory;
  effectiveVersion: FixedCostVersion | null;
  pendingFields: string[];
}

export interface FixedCostHistory {
  id: number;
  code: string;
  description: string;
  category: FixedCostCategory;
  versions: FixedCostVersion[];
}

export interface FixedCostVersionInput {
  unitCost?: string | null;
  unit?: string | null;
  effectiveFrom?: string;
}

/** Nova versão de item existente: a data de vigência é obrigatória. */
export interface NewFixedCostVersionInput extends FixedCostVersionInput {
  effectiveFrom: string;
}

export interface NewFixedCostInput extends FixedCostVersionInput {
  code: string;
  description: string;
  category: FixedCostCategory;
}
