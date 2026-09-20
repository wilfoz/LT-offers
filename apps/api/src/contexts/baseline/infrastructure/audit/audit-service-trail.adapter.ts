import { Injectable } from '@nestjs/common';
import { AuditEvent } from '@lt-offers/domain';
import { AuditService } from '../../../../audit/audit.service';
import { AuditTrailPort } from '../../domain';

/**
 * Delegação à trilha de auditoria global (módulo transversal, fora da
 * série hexagonal) — eventos idênticos aos emitidos pelo legado.
 */
@Injectable()
export class AuditServiceTrailAdapter implements AuditTrailPort {
  constructor(private readonly auditService: AuditService) {}

  logEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): void {
    this.auditService.logEvent(event);
  }
}
