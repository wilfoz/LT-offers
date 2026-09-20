/**
 * Contratos de domínio para cronograma físico e planejamento temporal (Módulo M07, RF-35..RF-41, RN-15, RN-16).
 * Valores numéricos trafegam como string formatada para precisão decimal exata (RNF-08).
 */

export type ActivityGroup =
  | 'INDIRECTS'
  | 'CAMPS'
  | 'PRELIMINARIES'
  | 'CIVIL_WORKS'
  | 'TOWER_ERECTION'
  | 'STRINGING'
  | 'COMMISSIONING';

export type QuantitySourceRef =
  | 'TOTAL_TOWERS'
  | 'TOWER_TONNAGE'
  | 'TOTAL_FOUNDATIONS'
  | 'EXCAVATION_VOLUME'
  | 'CONCRETE_VOLUME'
  | 'CONDUCTOR_KM'
  | 'GROUND_WIRE_KM'
  | 'OPGW_KM'
  | 'ROW_CLEARING_HA'
  | 'ACCESS_KM'
  | 'MANUAL';

export type MilestoneType =
  'LI' | 'LO' | 'START_WORK' | 'ENERGIZATION' | 'SUBSTATION_BAY';

export interface MilestoneContract {
  id: string;
  code: MilestoneType;
  name: string;
  targetMonth: number; // Mês indexado (M1, M2...)
  targetDate?: string; // Data ISO opcional
  description?: string;
  isMandatory: boolean;
}

export type DependencyType = 'FS' | 'SS' | 'FF' | 'SF';

export interface ActivityPredecessor {
  activityId: string;
  type: DependencyType;
  lagMonths: number;
}

export type ActivityScheduleStatus =
  | 'PLANNED'
  | 'WARNING_OVERPRODUCTION'
  | 'WARNING_PRECEDENCE'
  | 'WARNING_MILESTONE_DEADLINE'
  | 'CRITICAL';

export interface ScheduleActivity {
  id: string;
  lineId: number;
  code: string;
  name: string;
  group: ActivityGroup;
  quantitySource: QuantitySourceRef;
  totalQuantity: string;
  quantityUnit: string;
  assignedCrewId?: number;
  assignedCrewName?: string;
  crewCount: number;
  startMonth: number;
  durationMonths: number;
  endMonth: number;
  monthlyProduction: string;
  maxMonthlyProduction?: string;
  accessDifficultyFactor?: string;
  predecessors: ActivityPredecessor[];
  mobilizationCost: string;
  monthlyRecurringCost: string;
  demobilizationCost: string;
  totalCost: string;
  status: ActivityScheduleStatus;
  statusNotes?: string[];
}

export type PrecipitationLevel = 1 | 2 | 3 | 4 | 5;

export interface PrecipitationFactor {
  uf: string;
  month: number; // 1 (Jan) a 12 (Dez)
  precipitationMm: string;
  level: PrecipitationLevel;
  productivityFactor: string; // Ex: "1.00", "0.95", "0.85", "0.75", "0.65"
}

export interface ScheduleSummary {
  lineId: number;
  lineName?: string;
  startMonth: number;
  totalDurationMonths: number;
  activities: ScheduleActivity[];
  milestones: MilestoneContract[];
  totalDirectLaborCost: string;
  totalEquipmentCost: string;
  totalIndirectCost: string;
  totalScheduleCost: string;
  warnings: string[];
}
