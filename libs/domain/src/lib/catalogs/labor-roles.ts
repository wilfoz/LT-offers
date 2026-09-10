/**
 * Contratos do catálogo de mão de obra (DB_MO, RF-12, RN-14) trocados entre
 * api e web. Valores monetários e percentuais trafegam como string formatada
 * (RNF-08). null significa "não informado", distinto de "0" (RNF-09).
 */

export interface LaborRoleVersion {
  id: number;
  baseSalary: string | null;
  hazardPayPercent: string | null;
  overtimePercent: string | null;
  dsrOvertimePercent: string | null;
  socialChargesPercent: string | null;
  foodAllowanceMonthly: string | null;
  housingMonthly: string | null;
  homeLeaveTravelMonthly: string | null;
  healthInsuranceMonthly: string | null;
  lifeInsuranceMonthly: string | null;
  effectiveFrom: string;
  createdBy: string;
  createdAt: string;
}

export interface LaborRoleSummary {
  id: number;
  code: string;
  name: string;
  effectiveVersion: LaborRoleVersion | null;
  pendingFields: string[];
}

export interface LaborRoleHistory {
  id: number;
  code: string;
  name: string;
  versions: LaborRoleVersion[];
}

export interface LaborRoleVersionInput {
  baseSalary?: string | null;
  hazardPayPercent?: string | null;
  overtimePercent?: string | null;
  dsrOvertimePercent?: string | null;
  socialChargesPercent?: string | null;
  foodAllowanceMonthly?: string | null;
  housingMonthly?: string | null;
  homeLeaveTravelMonthly?: string | null;
  healthInsuranceMonthly?: string | null;
  lifeInsuranceMonthly?: string | null;
  effectiveFrom?: string;
}

/** Nova versão de item existente: a data de vigência é obrigatória. */
export interface NewLaborRoleVersionInput extends LaborRoleVersionInput {
  effectiveFrom: string;
}

export interface NewLaborRoleInput extends LaborRoleVersionInput {
  code: string;
  name: string;
}
