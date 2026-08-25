/**
 * Contratos do catálogo de tipos de solo (origem DB_FUN) trocados entre api e
 * web. Valores decimais trafegam como string (RNF-08); a faixa de NSPT é um
 * par de inteiros (mínimo inclusivo, máximo exclusivo — x≤N<y na planilha) e
 * pode ser não informada (caso rocha). null significa "não informado",
 * distinto de zero e de false (RNF-09).
 */

export interface SoilTypeVersion {
  id: number;
  description: string | null;
  submerged: boolean | null;
  allowableCompressionStressKgfCm2: string | null;
  specificWeightKgfM3: string | null;
  internalFrictionAngleDeg: string | null;
  cohesionKgCm2: string | null;
  nsptMin: number | null;
  nsptMax: number | null;
  effectiveFrom: string;
  createdBy: string;
  createdAt: string;
}

export interface SoilTypeSummary {
  id: number;
  code: string;
  effectiveVersion: SoilTypeVersion | null;
  pendingFields: string[];
}

export interface SoilTypeHistory {
  id: number;
  code: string;
  versions: SoilTypeVersion[];
}

export interface SoilTypeVersionInput {
  description?: string | null;
  submerged?: boolean | null;
  allowableCompressionStressKgfCm2?: string | null;
  specificWeightKgfM3?: string | null;
  internalFrictionAngleDeg?: string | null;
  cohesionKgCm2?: string | null;
  nsptMin?: number | null;
  nsptMax?: number | null;
  effectiveFrom?: string;
}

/** Nova versão de item existente: a data de vigência é obrigatória. */
export interface NewSoilTypeVersionInput extends SoilTypeVersionInput {
  effectiveFrom: string;
}

export interface NewSoilTypeInput extends SoilTypeVersionInput {
  code: string;
}
