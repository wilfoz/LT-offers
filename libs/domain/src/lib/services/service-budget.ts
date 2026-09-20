/**
 * Origem do custo de um serviço (RF-46).
 * - SCHEDULE_DIRECT: Derivado diretamente do cálculo de equipes no cronograma físico (M07).
 * - PARAMETRIC_ADJUSTED: Cronograma parametrizado com fatores de ajuste/dificuldade.
 * - SUBCONTRACT_QUOTED: Subcontratação direta com cotação fechada de terceiros.
 */
export type ServiceCostSource =
  'SCHEDULE_DIRECT' | 'PARAMETRIC_ADJUSTED' | 'SUBCONTRACT_QUOTED';

/**
 * Grupos padrão de serviços de Linhas de Transmissão.
 */
export type ServiceGroup =
  | 'PRELIMINARY_WORKS'
  | 'CIVIL_WORKS'
  | 'ASSEMBLY_WORKS'
  | 'STRINGING_WORKS'
  | 'COMMISSIONING'
  | 'INDIRECTS_SUPPORT';

/**
 * Referência padronizada CIP do contratante (ex.: GR01.02.01).
 */
export interface CipReference {
  cipCode: string;
  description: string;
  unit: string;
}

/**
 * Item analítico de orçamento de serviços (RF-46, RF-47, RF-48).
 */
export interface ServiceBudgetItem {
  id: string;
  lineId: string;
  code: string;
  name: string;
  group: ServiceGroup;
  cipCode?: string;
  costSource: ServiceCostSource;
  quantity: string;
  unit: string;
  unitDirectCost: string;
  totalDirectCost: string;
  bdiPercentage: string;
  unitSalePrice: string;
  totalSalePrice: string;
  notes?: string;
}

/**
 * Indicadores paramétricos de benchmarking de custo (RF-49).
 */
export interface ServiceRatios {
  costPerKm: string;
  costPerTower: string;
  salePricePerKm: string;
  salePricePerTower: string;
}

/**
 * Resumo consolidado do orçamento de serviços por linha e por grupo (RF-46..RF-50).
 */
export interface ServiceBudgetSummary {
  lineId: string;
  lineName: string;
  lineLengthKm: string;
  totalTowers: number;
  items: ServiceBudgetItem[];
  totalDirectCost: string;
  totalSalePrice: string;
  ratios: ServiceRatios;
  byGroup: Record<
    ServiceGroup,
    {
      totalDirectCost: string;
      totalSalePrice: string;
      costPerKm: string;
      costPerTower: string;
    }
  >;
}
