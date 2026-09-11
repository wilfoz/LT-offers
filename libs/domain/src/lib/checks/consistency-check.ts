/**
 * Severidade de uma regra de verificação de consistência (RF-62, RF-63).
 * CRITICAL: Inconsistência impeditiva que bloqueia fechamento de revisão.
 * WARNING: Desvio operacional permitido mediante justificativa formal.
 * INFO: Recomendação ou nota informativa.
 */
export type CheckSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

/**
 * Módulos do motor de cálculo auditados pelas verificações.
 */
export type CheckModule =
  | 'STAKING'
  | 'MATERIALS_TAX'
  | 'SCHEDULE_RESOURCES'
  | 'HISTOGRAM_CAMPS'
  | 'SERVICES_CONTRACT'
  | 'CASHFLOW_DISBURSEMENT';

/**
 * Destino de navegação direta (deep linking) para correção da pendência na UI.
 */
export interface CheckNavigationTarget {
  tab: string;
  lineId?: string;
  entityId?: string;
  field?: string;
}

/**
 * Achado / Inconsistência identificada pelo motor de verificações (RF-62).
 */
export interface CheckFinding {
  id: string;
  ruleId: string;
  module: CheckModule;
  severity: CheckSeverity;
  title: string;
  message: string;
  lineId?: string;
  lineName?: string;
  navigationTarget?: CheckNavigationTarget;
}

/**
 * Estado geral de saúde da proposta comercial.
 */
export type OfferHealthStatus = 'HEALTHY' | 'WARNINGS_ONLY' | 'CRITICAL_ERRORS';

/**
 * Sumário executivo de consistência e governança da oferta (RF-62, RF-63).
 */
export interface OfferHealthSummary {
  offerId: string;
  status: OfferHealthStatus;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  findings: CheckFinding[];
  /** Indica se a revisão da proposta pode ser fechada sem impedimentos. */
  canCloseRevision: boolean;
  /** Indica se o fechamento exige justificativa textual formal por alertas. */
  requiresJustification: boolean;
}
