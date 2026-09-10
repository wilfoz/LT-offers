/**
 * Contratos de domínio para histograma de recursos e balanço de frotas (Módulo M08, RF-42..RF-45, RN-17).
 * Segregação de mão de obra direta/indireta e balanço de equipamentos próprios vs déficit de locação.
 */

export interface MonthlyManpowerHeadcount {
  month: number;
  count: number;
}

export interface ManpowerHistogramItem {
  laborRoleId: number;
  laborRoleCode: string;
  laborRoleName: string;
  isDirect: boolean; // true para equipes de produção, false para canteiros/indiretos
  category?: string;
  monthlyHeadcount: MonthlyManpowerHeadcount[];
  peakHeadcount: number;
  peakMonth: number;
  totalManMonths: string; // Esforço total em homem-mês
}

export interface MonthlyEquipmentDemand {
  month: number;
  totalRequired: number;
  ownUsed: number;
  deficitToRent: number;
  estimatedRentalCost: string;
}

export interface EquipmentHistogramItem {
  equipmentId: number;
  equipmentCode: string;
  equipmentDescription: string;
  category?: string;
  ownUnitsAvailable: number;
  monthlyDemand: MonthlyEquipmentDemand[];
  peakDemand: number;
  peakMonth: number;
  totalMachineMonths: string;
  totalRentalMachineMonths: string;
  totalRentalCost: string;
}

export interface MonthlyHistogramSummaryPoint {
  month: number;
  directManpower: number;
  indirectManpower: number;
  totalManpower: number;
  totalEquipment: number;
  ownEquipment: number;
  rentedEquipment: number;
  monthlyRentalCost: string;
  cumulativeManMonths: string;
  cumulativeEquipmentMonths: string;
}

export interface ResourceHistogramSummary {
  lineId?: number;
  totalMonths: number;
  manpowerItems: ManpowerHistogramItem[];
  equipmentItems: EquipmentHistogramItem[];
  monthlyTimeline: MonthlyHistogramSummaryPoint[];
  peakManpower: {
    month: number;
    direct: number;
    indirect: number;
    total: number;
    drivingActivities: string[];
  };
  peakEquipment: {
    month: number;
    total: number;
    own: number;
    rented: number;
  };
  totalDirectManMonths: string;
  totalIndirectManMonths: string;
  totalManMonths: string;
  totalEquipmentRentalCost: string;
}
