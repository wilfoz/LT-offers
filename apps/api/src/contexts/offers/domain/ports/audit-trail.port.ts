import { AuditEvent } from '@lt-offers/domain';

/**
 * Porta fina para a trilha de auditoria (RF-65, RNF-12): os casos de uso
 * emitem eventos de transição de status com o status anterior e o novo —
 * o interceptor de auditoria da borda não conhece o estado anterior.
 */
export interface OffersAuditTrailPort {
  logEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): void;
}

export const OFFERS_AUDIT_TRAIL_PORT = Symbol('OFFERS_AUDIT_TRAIL_PORT');
