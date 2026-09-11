/**
 * Contratos de domínio para Aditivos Contratuais e Pleitos de Engenharia (Change Orders).
 * (Fase F7 do Roadmap - requisitos-calculo-lt.md §10, §13, §14).
 */

export const CHANGE_ORDER_TYPES = [
  'GEOTECHNICAL_SOIL',
  'ALIGNMENT_TOWER_RELOCATION',
  'ENVIRONMENTAL_REQUISITION',
  'PRICE_READJUSTMENT',
  'SCOPE_ADDITION',
  'SCOPE_REDUCTION',
  'OTHER',
] as const;
export type ChangeOrderType = (typeof CHANGE_ORDER_TYPES)[number];

export const CHANGE_ORDER_TYPE_LABELS: Record<ChangeOrderType, string> = {
  GEOTECHNICAL_SOIL: 'Alteração de Geotecnia / Solo Imprevisto',
  ALIGNMENT_TOWER_RELOCATION: 'Realocação de Traçado & Estruturas',
  ENVIRONMENTAL_REQUISITION: 'Exigência de Licenciamento Ambiental',
  PRICE_READJUSTMENT: 'Reajuste / Desequilíbrio Econômico',
  SCOPE_ADDITION: 'Aditivo de Escopo pelo Contratante',
  SCOPE_REDUCTION: 'Supressão de Escopo Contratual',
  OTHER: 'Outros Pleitos e Reivindicações',
};

export const CHANGE_ORDER_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
] as const;
export type ChangeOrderStatus = (typeof CHANGE_ORDER_STATUSES)[number];

export const CHANGE_ORDER_STATUS_LABELS: Record<ChangeOrderStatus, string> = {
  DRAFT: 'Em Elaboração',
  SUBMITTED: 'Submetido ao Cliente',
  APPROVED: 'Aprovado / Contratado',
  REJECTED: 'Rejeitado / Glosado',
  CANCELLED: 'Cancelado',
};

export interface ContractChangeOrder {
  id?: number;
  baselineId: number;
  code: string; // Ex: 'AD-01', 'PL-02'
  title: string;
  type: ChangeOrderType;
  status: ChangeOrderStatus;
  requestedCostDelta: string; // Variação monetária solicitada (R$)
  approvedCostDelta?: string | null; // Variação monetária aprovada (R$)
  scheduleDeltaMonths: number; // Impacto em prazo (meses)
  description: string;
  justification: string;
  wbsCodeAffected?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CurrentWorkingEstimate {
  baselineId: number;
  baselineContractValue: string;
  baselineBudgetCost: string;
  baselineScheduleMonths: number;
  totalApprovedAdditivesCost: string;
  totalPendingAdditivesCost: string;
  approvedScheduleDeltaMonths: number;
  currentWorkingEstimateValue: string; // Baseline + Aprovados
  currentWorkingScheduleMonths: number; // Baseline + Delta Meses
  changeOrdersCount: number;
  approvedChangeOrdersCount: number;
}

export interface CreateChangeOrderPayload {
  baselineId: number;
  code: string;
  title: string;
  type: ChangeOrderType;
  requestedCostDelta: string;
  approvedCostDelta?: string;
  scheduleDeltaMonths?: number;
  description: string;
  justification: string;
  wbsCodeAffected?: string | null;
  status?: ChangeOrderStatus;
  createdBy: string;
}

export interface UpdateChangeOrderPayload {
  title?: string;
  type?: ChangeOrderType;
  status?: ChangeOrderStatus;
  requestedCostDelta?: string;
  approvedCostDelta?: string;
  scheduleDeltaMonths?: number;
  description?: string;
  justification?: string;
  wbsCodeAffected?: string | null;
  approvedBy?: string | null;
}
