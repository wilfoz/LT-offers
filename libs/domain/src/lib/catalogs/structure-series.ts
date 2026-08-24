/**
 * Contratos do catálogo de séries de estruturas trocados entre api e web
 * (nível série; os tipos de torre estão em tower-types.ts). Valores decimais
 * trafegam como string (RNF-08); contagens são inteiros. null significa
 * "não informado", distinto de "0" (RNF-09).
 */

export interface StructureSeriesVersion {
  id: number;
  designer: string | null;
  voltageKv: string | null;
  circuitCount: number | null;
  cablesPerPhase: number | null;
  designWindSpeedMs: string | null;
  insulatorType: string | null;
  silMw: string | null;
  effectiveFrom: string;
  createdBy: string;
  createdAt: string;
}

export interface StructureSeriesSummary {
  id: number;
  name: string;
  towerTypeCount: number;
  effectiveVersion: StructureSeriesVersion | null;
  pendingFields: string[];
}

export interface StructureSeriesHistory {
  id: number;
  name: string;
  versions: StructureSeriesVersion[];
}

export interface StructureSeriesVersionInput {
  designer?: string | null;
  voltageKv?: string | null;
  circuitCount?: number | null;
  cablesPerPhase?: number | null;
  designWindSpeedMs?: string | null;
  insulatorType?: string | null;
  silMw?: string | null;
  effectiveFrom?: string;
}

/** Nova versão de item existente: a data de vigência é obrigatória. */
export interface NewStructureSeriesVersionInput extends StructureSeriesVersionInput {
  effectiveFrom: string;
}

export interface NewStructureSeriesInput extends StructureSeriesVersionInput {
  name: string;
}
