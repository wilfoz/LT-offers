import { Injectable } from '@nestjs/common';
import { AuditEvent } from '@lt-offers/domain';
import { AuditService } from '../../../../audit/audit.service';
import { OffersAuditTrailPort } from '../../domain/ports/audit-trail.port';

/**
 * Delegação à trilha de auditoria global (módulo transversal, fora da
 * série hexagonal) — precedente do contexto baseline.
 */
@Injectable()
export class OffersAuditTrailAdapter implements OffersAuditTrailPort {
  constructor(private readonly auditService: AuditService) {}

  logEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): void {
    this.auditService.logEvent(event);
  }
}
