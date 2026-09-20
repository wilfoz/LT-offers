import { UserRole } from '../governance/rbac';

/**
 * Ações auditáveis no sistema (RF-65, RNF-12).
 */
export type AuditAction =
  'CREATE' | 'UPDATE' | 'DELETE' | 'FREEZE' | 'CLONE' | 'SIMULATE' | 'EXPORT';

/**
 * Recursos auditáveis no sistema.
 */
export type AuditResource =
  | 'OFFER'
  | 'REVISION'
  | 'LINE'
  | 'STAKING'
  | 'PRICING'
  | 'SCHEDULE'
  | 'CAMPS'
  | 'HISTOGRAM'
  | 'SERVICES'
  | 'ECONOMIC_RESULT'
  | 'RISKS'
  | 'CATALOG'
  | 'EXPORT';

/**
 * Registro de diferença entre estado anterior e novo (RF-65, RNF-12).
 */
export interface AuditDiff {
  field: string;
  previousValue?: unknown;
  newValue?: unknown;
}

/**
 * Evento imutável de trilha de auditoria (RF-65, RNF-12).
 */
export interface AuditEvent {
  id: string;
  timestamp: string; // ISO 8601 UTC
  userId: string;
  userName: string;
  userRole: UserRole;
  resource: AuditResource;
  resourceId?: string;
  offerId?: string;
  revisionId?: string;
  action: AuditAction;
  description: string;
  diffs?: AuditDiff[];
}

/**
 * Filtro de consulta para a trilha de auditoria (RF-65).
 */
export interface AuditFilter {
  offerId?: string;
  resource?: AuditResource;
  userId?: string;
  action?: AuditAction;
  startDate?: string;
  endDate?: string;
}
