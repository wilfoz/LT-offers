/**
 * Contratos de domínio para Pacote de Integração e Carga com ERPs Corporativos (SAP, TOTVS/RM, Sienge/Mega).
 * (Fase F7 do Roadmap - requisitos-calculo-lt.md §10, §13, §14).
 */

export const ERP_TARGET_SYSTEMS = [
  'SAP',
  'TOTVS_RM',
  'MEGA_SIENGE',
  'GENERIC_JSON',
] as const;
export type ErpTargetSystem = (typeof ERP_TARGET_SYSTEMS)[number];

export const ERP_TARGET_SYSTEM_LABELS: Record<ErpTargetSystem, string> = {
  SAP: 'SAP S/4HANA (Plano de Contas & Centros de Custo)',
  TOTVS_RM: 'TOTVS Linha RM / Protheus (Obras & Projetos)',
  MEGA_SIENGE: 'Mega / Sienge ERP da Construção Civil',
  GENERIC_JSON: 'Estrutura Canônica JSON / XLSX Universal',
};

export interface ErpAccountMapping {
  costCenterCode: string; // Ex: 'CC-LT01-01'
  costCenterName: string;
  generalLedgerAccount: string; // Conta contábil (ex: '1.1.03.001')
  budgetAccountCode: string; // Conta orçamentária (ex: 'ORC-CIV-001')
  wbsCode: string; // Código EAP (ex: '01.03.01')
  description: string;
  unit: string;
  totalBudgetedCost: string;
}

export interface ErpScheduleEntry {
  monthNumber: number;
  periodDate: string; // YYYY-MM
  costCenterCode: string;
  wbsCode: string;
  plannedCostAmount: string;
  plannedDisbursementAmount: string;
  currency: string;
}

export interface ErpIntegrationPackage {
  offerCode: string;
  offerName: string;
  revisionNumber: number;
  baselineNumber: number;
  baselineFrozenAt: string;
  targetSystem: ErpTargetSystem;
  generatedAt: string;
  generatedBy: string;
  companyCode: string;
  totalContractValue: string;
  totalBudgetCost: string;
  currency: string;
  accounts: ErpAccountMapping[];
  monthlySchedule: ErpScheduleEntry[];
}

export interface GenerateErpPackagePayload {
  baselineId: number;
  targetSystem: ErpTargetSystem;
  companyCode?: string;
  generatedBy: string;
}
