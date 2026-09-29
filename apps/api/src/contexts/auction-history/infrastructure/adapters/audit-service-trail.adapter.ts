import { Injectable } from '@nestjs/common';
import { AuditEvent } from '@lt-offers/domain';
import { AuditService } from '../../../../audit/audit.service';
import { AuctionHistoryAuditTrailPort } from '../../domain/ports/audit-trail.port';

/**
 * Delegação à trilha de auditoria global (módulo transversal) — precedente
 * dos contextos baseline e offers.
 */
@Injectable()
export class AuctionHistoryAuditTrailAdapter implements AuctionHistoryAuditTrailPort {
  constructor(private readonly auditService: AuditService) {}

  logEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): void {
    this.auditService.logEvent(event);
  }
}
