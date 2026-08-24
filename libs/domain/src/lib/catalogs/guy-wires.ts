/**
 * Contratos do catálogo de cabos de aço para tirante trocados entre api e
 * web. Valores decimais trafegam como string (RNF-08); número de fios é
 * inteiro. null significa "não informado", distinto de "0" (RNF-09).
 */

export interface GuyWireVersion {
  id: number;
  description: string | null;
  weightTonPerKm: string | null;
  reelLengthM: string | null;
  diameterMm: string | null;
  utsKn: string | null;
  galvanizationClass: string | null;
  strengthGrade: string | null;
  wireCount: number | null;
  effectiveFrom: string;
  createdBy: string;
  createdAt: string;
}

export interface GuyWireSummary {
  id: number;
  code: string;
  effectiveVersion: GuyWireVersion | null;
  pendingFields: string[];
}

export interface GuyWireHistory {
  id: number;
  code: string;
  versions: GuyWireVersion[];
}

export interface GuyWireVersionInput {
  description?: string | null;
  weightTonPerKm?: string | null;
  reelLengthM?: string | null;
  diameterMm?: string | null;
  utsKn?: string | null;
  galvanizationClass?: string | null;
  strengthGrade?: string | null;
  wireCount?: number | null;
  effectiveFrom?: string;
}

/** Nova versão de item existente: a data de vigência é obrigatória. */
export interface NewGuyWireVersionInput extends GuyWireVersionInput {
  effectiveFrom: string;
}

export interface NewGuyWireInput extends GuyWireVersionInput {
  code: string;
}
