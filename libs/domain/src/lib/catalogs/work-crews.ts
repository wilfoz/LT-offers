/**
 * Contratos do catálogo de equipes de trabalho e composições (Equipos e DesEquipos,
 * RF-14, RF-15, RN-15) trocados entre api e web.
 * Valores numéricos trafegam como string formatada (RNF-08). null significa "não informado",
 * distinto de "0" (RNF-09).
 */

export type ProductionPeriod = 'HOUR' | 'DAY' | 'WEEK' | 'MONTH';

export interface WorkCrewLaborRoleItem {
  laborRoleId: number;
  laborRoleCode?: string;
  laborRoleName?: string;
  quantity: string;
}

export interface WorkCrewEquipmentItem {
  equipmentId: number;
  equipmentCode?: string;
  equipmentDescription?: string;
  quantity: string;
}

export interface WorkCrewVersion {
  id: number;
  standardProductionRate: string | null;
  productionUnit: string | null;
  productionPeriod: ProductionPeriod | null;
  effectiveFrom: string;
  createdBy: string;
  createdAt: string;
  laborRoles: WorkCrewLaborRoleItem[];
  equipments: WorkCrewEquipmentItem[];
}

export interface WorkCrewSummary {
  id: number;
  code: string;
  name: string;
  laborRoleCount: number;
  equipmentCount: number;
  effectiveVersion: WorkCrewVersion | null;
  pendingFields: string[];
}

export interface WorkCrewHistory {
  id: number;
  code: string;
  name: string;
  versions: WorkCrewVersion[];
}

export interface WorkCrewLaborRoleInput {
  laborRoleId: number;
  quantity: string;
}

export interface WorkCrewEquipmentInput {
  equipmentId: number;
  quantity: string;
}

export interface WorkCrewVersionInput {
  standardProductionRate?: string | null;
  productionUnit?: string | null;
  productionPeriod?: ProductionPeriod | null;
  effectiveFrom?: string;
  laborRoles?: WorkCrewLaborRoleInput[];
  equipments?: WorkCrewEquipmentInput[];
}

/** Nova versão de item existente: a data de vigência é obrigatória. */
export interface NewWorkCrewVersionInput extends WorkCrewVersionInput {
  effectiveFrom: string;
}

export interface NewWorkCrewInput extends WorkCrewVersionInput {
  code: string;
  name: string;
}
