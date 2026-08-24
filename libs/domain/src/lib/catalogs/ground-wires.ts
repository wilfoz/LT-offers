/**
 * Contratos do catálogo de cabos de guarda (tipos aço e OPGW) trocados entre
 * api e web. Valores decimais trafegam como string (RNF-08); contagens são
 * inteiros. null significa "não informado", distinto de "0" (RNF-09).
 * O tipo pertence à identidade do item e não muda entre versões; campos
 * específicos do outro tipo são rejeitados pela API.
 */

export const GROUND_WIRE_TYPES = ['STEEL', 'OPGW'] as const;
export type GroundWireType = (typeof GROUND_WIRE_TYPES)[number];

export interface GroundWireVersion {
  id: number;
  description: string | null;
  weightTonPerKm: string | null;
  reelLengthM: string | null;
  diameterMm: string | null;
  utsKn: string | null;
  // Específicos do tipo aço
  galvanizationClass: string | null;
  strengthGrade: string | null;
  wireCount: number | null;
  // Específicos do tipo OPGW
  manufacturer: string | null;
  i2tKa2s: string | null;
  fiberCount: number | null;
  effectiveFrom: string;
  createdBy: string;
  createdAt: string;
}

export interface GroundWireSummary {
  id: number;
  code: string;
  type: GroundWireType;
  effectiveVersion: GroundWireVersion | null;
  pendingFields: string[];
}

export interface GroundWireHistory {
  id: number;
  code: string;
  type: GroundWireType;
  versions: GroundWireVersion[];
}

export interface GroundWireVersionInput {
  description?: string | null;
  weightTonPerKm?: string | null;
  reelLengthM?: string | null;
  diameterMm?: string | null;
  utsKn?: string | null;
  galvanizationClass?: string | null;
  strengthGrade?: string | null;
  wireCount?: number | null;
  manufacturer?: string | null;
  i2tKa2s?: string | null;
  fiberCount?: number | null;
  effectiveFrom?: string;
}

/** Nova versão de item existente: a data de vigência é obrigatória. */
export interface NewGroundWireVersionInput extends GroundWireVersionInput {
  effectiveFrom: string;
}

export interface NewGroundWireInput extends GroundWireVersionInput {
  code: string;
  type: GroundWireType;
}
