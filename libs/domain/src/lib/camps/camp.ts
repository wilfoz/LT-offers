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
