/**
 * Contratos do catálogo de cabos condutores trocados entre api e web.
 * Valores numéricos trafegam como string decimal (RNF-08);
 * null significa "não informado", distinto de "0" (RNF-09).
 */

export interface ConductorCableVersion {
  id: number;
  description: string | null;
  weightTonPerKm: string | null;
  reelLengthM: string | null;
  diameterMm: string | null;
  utsKn: string | null;
  effectiveFrom: string;
  createdBy: string;
  createdAt: string;
}

export interface ConductorCableSummary {
  id: number;
  code: string;
  effectiveVersion: ConductorCableVersion | null;
  pendingFields: string[];
}

export interface ConductorCableHistory {
  id: number;
  code: string;
  versions: ConductorCableVersion[];
}

export interface ConductorCableVersionInput {
  description?: string | null;
  weightTonPerKm?: string | null;
  reelLengthM?: string | null;
  diameterMm?: string | null;
  utsKn?: string | null;
  effectiveFrom?: string;
}

/** Nova versão de item existente: a data de vigência é obrigatória. */
export interface NewConductorCableVersionInput extends ConductorCableVersionInput {
  effectiveFrom: string;
}

export interface NewConductorCableInput extends ConductorCableVersionInput {
  code: string;
}
