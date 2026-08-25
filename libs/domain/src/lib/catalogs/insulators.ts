/**
 * Contratos do catálogo de isoladores trocados entre api e web. Valores
 * decimais trafegam como string (RNF-08); tipo, fabricante e perfil são texto
 * livre (o levantamento não enumera valores — design D1 da change
 * catalogo-isoladores). null significa "não informado", distinto de "0"
 * (RNF-09).
 */

export interface InsulatorVersion {
  id: number;
  description: string | null;
  type: string | null;
  manufacturer: string | null;
  profile: string | null;
  ruptureStrengthKn: string | null;
  diameterMm: string | null;
  spacingMm: string | null;
  creepageDistanceMm: string | null;
  effectiveFrom: string;
  createdBy: string;
  createdAt: string;
}

export interface InsulatorSummary {
  id: number;
  code: string;
  effectiveVersion: InsulatorVersion | null;
  pendingFields: string[];
}

export interface InsulatorHistory {
  id: number;
  code: string;
  versions: InsulatorVersion[];
}

export interface InsulatorVersionInput {
  description?: string | null;
  type?: string | null;
  manufacturer?: string | null;
  profile?: string | null;
  ruptureStrengthKn?: string | null;
  diameterMm?: string | null;
  spacingMm?: string | null;
  creepageDistanceMm?: string | null;
  effectiveFrom?: string;
}

/** Nova versão de item existente: a data de vigência é obrigatória. */
export interface NewInsulatorVersionInput extends InsulatorVersionInput {
  effectiveFrom: string;
}

export interface NewInsulatorInput extends InsulatorVersionInput {
  code: string;
}
