/**
 * Contratos do catálogo de equipamentos (DB_EQ, RF-13, RN-17) trocados entre
 * api e web. Valores monetários trafegam como string formatada (RNF-08);
 * anos e contagens são inteiros. null significa "não informado", distinto de "0"
 * (RNF-09).
 */

export interface EquipmentVersion {
  id: number;
  externalRentalMonthly: string | null;
  internalRentalMonthly: string | null;
  purchasePrice: string | null;
  depreciationYears: number | null;
  ownedAvailabilityCount: number | null;
  fuelMaintenanceMonthly: string | null;
  effectiveFrom: string;
  createdBy: string;
  createdAt: string;
}

export interface EquipmentSummary {
  id: number;
  code: string;
  description: string;
  category: string | null;
  effectiveVersion: EquipmentVersion | null;
  pendingFields: string[];
}

export interface EquipmentHistory {
  id: number;
  code: string;
  description: string;
  category: string | null;
  versions: EquipmentVersion[];
}

export interface EquipmentVersionInput {
  externalRentalMonthly?: string | null;
  internalRentalMonthly?: string | null;
  purchasePrice?: string | null;
  depreciationYears?: number | null;
  ownedAvailabilityCount?: number | null;
  fuelMaintenanceMonthly?: string | null;
  effectiveFrom?: string;
}

/** Nova versão de item existente: a data de vigência é obrigatória. */
export interface NewEquipmentVersionInput extends EquipmentVersionInput {
  effectiveFrom: string;
}

export interface NewEquipmentInput extends EquipmentVersionInput {
  code: string;
  description: string;
  category?: string | null;
}
