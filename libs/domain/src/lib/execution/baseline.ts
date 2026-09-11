/**
 * Contratos de domínio para Linha de Base Contratual Imutável da Obra (Data 0).
 * (Fase F7 do Roadmap - requisitos-calculo-lt.md §10, §13, §14).
 */

export const BASELINE_STATUSES = ['ACTIVE', 'ARCHIVED', 'SUPERSEDED'] as const;
export type BaselineStatus = (typeof BASELINE_STATUSES)[number];

export const WORK_PACKAGE_CATEGORIES = [
  'PROJECT_TOPOGRAPHY',
  'ENVIRONMENT_EASEMENT',
  'CIVIL_FOUNDATIONS',
  'ELECTROMECHANICAL_ASSEMBLY',
  'CABLE_STRINGING',
  'COMMISSIONING',
  'INDIRECTS_MANAGEMENT',
] as const;
export type WorkPackageCategory = (typeof WORK_PACKAGE_CATEGORIES)[number];

export const WORK_PACKAGE_CATEGORY_LABELS: Record<WorkPackageCategory, string> = {
  PROJECT_TOPOGRAPHY: 'Projetos Executivos & Topografia',
  ENVIRONMENT_EASEMENT: 'Meio Ambiente, Faixa & Acessos',
  CIVIL_FOUNDATIONS: 'Obras Civis & Fundações',
  ELECTROMECHANICAL_ASSEMBLY: 'Montagem Eletromecânica',
  CABLE_STRINGING: 'Lançamento & Tensionamento de Cabos',
  COMMISSIONING: 'Comissionamento, Ensaios & Energização',
  INDIRECTS_MANAGEMENT: 'Administração Local, Indiretos & Canteiro',
};

export interface WorkPackageItem {
  id?: number;
  wbsCode: string; // Ex: '01.01', '02.03'
  name: string;
  category: WorkPackageCategory;
  budgetedCost: string; // Valor monetário Decimal
  weightPercent: string; // Peso % Decimal no escopo total da obra
  unit: string; // Ex: 'un', 'km', 'm3', 't', 'vb'
  plannedQuantity: string; // Quantidade física planejada Decimal
  lineCode?: string | null; // Vínculo com a LT
  cipAccountCode?: string | null; // Vínculo com plano de contas CIP
}

export interface WorkBaseline {
  id: number;
  offerId: number;
  revisionId: number;
  baselineNumber: number;
  name: string;
  status: BaselineStatus;
  totalContractValue: string; // Valor de venda contratual da proposta (R$)
  totalBudgetCost: string; // Custo orçado total de execução (R$)
  targetMarginPercent: string; // Margem planejada %
  scheduleMonths: number; // Prazo total de obra em meses
  frozenAt: string; // ISO DateTime UTC
  frozenBy: string;
  notes?: string | null;
  workPackages: WorkPackageItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateBaselinePayload {
  offerId: number;
  revisionId: number;
  name?: string;
  frozenBy: string;
  notes?: string | null;
}
