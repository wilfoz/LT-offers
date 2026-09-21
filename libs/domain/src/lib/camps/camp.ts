/**
 * Contratos de domínio para dimensionamento e custos de canteiros de obra (RF-41).
 * Abrange canteiro central/principal e canteiros avançados.
 */

export type CampType = 'CENTRAL' | 'ADVANCED';

export interface CampPersonnelItem {
  laborRoleId: number;
  laborRoleCode?: string;
  laborRoleName?: string;
  quantity: number;
  monthlyUnitCost: string;
  totalMonthlyCost: string;
}

export interface CampDefinition {
  id: string;
  lineId: number;
  code: string;
  name: string;
  type: CampType;
  locationKm?: string;
  startMonth: number;
  durationMonths: number;
  endMonth: number;
  implementationCost: string;
  fixedMonthlyCost: string;
  demobilizationCost: string;
  personnel: CampPersonnelItem[];
  totalPersonnelMonthlyCost: string;
  totalMonthlyCost: string; // fixedMonthlyCost + totalPersonnelMonthlyCost
  totalCampCost: string; // implementationCost + (totalMonthlyCost * durationMonths) + demobilizationCost
}

export interface CampCostSummary {
  lineId: number;
  camps: CampDefinition[];
  totalImplementationCost: string;
  totalOperatingCost: string;
  totalDemobilizationCost: string;
  totalCampsCost: string;
  monthlyDistribution: { month: number; cost: string }[];
}

/**
 * Detalhamento analítico de equipe de administração e indiretos de obra (Aba Indirectos / RF-41).
 */
export interface ProjectIndirectStaffItem {
  id: string;
  roleCode: string;
  roleName: string;
  category:
    | 'MANAGEMENT'
    | 'SUPERVISION'
    | 'SAFETY_ENVIRONMENT'
    | 'ADMINISTRATION'
    | 'LOGISTICS';
  headcount: number;
  vehicleType?: string; // Ex: 'VEÍCULO TIPO DUSTER 4X4'
  phoneTier?: string; // Ex: 'TELEFONE FROTA GAMA ALTA'
  laptopAssigned?: boolean;
  epiMonthlyBrl: number;
  examsBrl: number;
  travelMonthlyBrl: number;
  salaryMonthlyBrl: number;
  totalMonthlyBrl: number;
}

