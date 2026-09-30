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

/** Rótulos de exibição das categorias (RNF-14), fonte única para api e web. */
export const FIXED_COST_CATEGORY_LABELS: Readonly<
  Record<FixedCostCategory, string>
> = {
  EPI: 'EPI (Equipamentos de Proteção)',
  MEDICAL_EXAM: 'Exames Médicos',
  UNIFORM: 'Uniformes',
  MOB_DEMOB: 'Mobilização e Desmobilização',
  TRAVEL_HOUSING: 'Passagens e Hospedagens',
  OTHER: 'Outros Custos Fixos',
};

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
