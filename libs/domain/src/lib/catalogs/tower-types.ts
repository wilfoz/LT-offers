/**
 * Contratos do catálogo de tipos de torre (nível filho da série de estrutura)
 * trocados entre api e web. Valores decimais trafegam como string (RNF-08);
 * estais são inteiros e zero é valor válido (torre autoportante), distinto de
 * null = "não informado" (RNF-09). A função pertence à identidade do tipo e
 * não muda entre versões. A tabela peso × altura pertence à versão (imutável
 * com ela) e trafega ordenada por altura.
 */

export const TOWER_FUNCTIONS = ['SUSPENSION', 'ANCHOR'] as const;
export type TowerFunction = (typeof TOWER_FUNCTIONS)[number];

export interface TowerWeightPoint {
  heightM: string;
  weightKg: string;
}

export interface TowerTypeVersion {
  id: number;
  guyCount: number | null;
  weights: TowerWeightPoint[];
  effectiveFrom: string;
  createdBy: string;
  createdAt: string;
}

export interface TowerTypeSummary {
  id: number;
  code: string;
  function: TowerFunction;
  effectiveVersion: TowerTypeVersion | null;
  pendingFields: string[];
}

export interface TowerTypeHistory {
  id: number;
  code: string;
  function: TowerFunction;
  versions: TowerTypeVersion[];
}

export interface TowerTypeVersionInput {
  guyCount?: number | null;
  weights?: TowerWeightPoint[];
  effectiveFrom?: string;
}

/** Nova versão de item existente: a data de vigência é obrigatória. */
export interface NewTowerTypeVersionInput extends TowerTypeVersionInput {
  effectiveFrom: string;
}

export interface NewTowerTypeInput extends TowerTypeVersionInput {
  code: string;
  function: TowerFunction;
}
