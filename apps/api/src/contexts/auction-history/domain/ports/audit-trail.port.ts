import { AuditEvent } from '@lt-offers/domain';

/**
 * Porta fina para a trilha de auditoria (RF-65, RNF-12), no precedente dos
 * contextos baseline e offers: a sincronização emite o evento com a
 * contagem importada, que a borda não conhece.
 */
export interface AuctionHistoryAuditTrailPort {
  logEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): void;
}
