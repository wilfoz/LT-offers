import { AuditEvent } from '@lt-offers/domain';

/**
 * Porta fina para a trilha de auditoria (RF-65, RNF-12): os casos de uso
 * emitem eventos idênticos aos do legado sem depender do módulo global.
 */
export interface AuditTrailPort {
  logEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): void;
}
