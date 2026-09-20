import { Injectable } from '@nestjs/common';
import { AuditEvent, AuditFilter } from '@lt-offers/domain';

@Injectable()
export class AuditService {
  private events: AuditEvent[] = [
    {
      id: 'audit-seed-01',
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      userId: 'user-admin-01',
      userName: 'Lucas Administrador',
      userRole: 'ADMIN',
      resource: 'OFFER',
      resourceId: '1',
      offerId: '1',
      action: 'CREATE',
      description: 'Criação inicial da oferta Lote 1 - Leilão 01/2026',
      diffs: [
        {
          field: 'name',
          previousValue: null,
          newValue: 'Lote 1 - Leilão 01/2026',
        },
        { field: 'revision', previousValue: null, newValue: 'R0' },
      ],
    },
    {
      id: 'audit-seed-02',
      timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
      userId: 'user-comm-01',
      userName: 'Marcos Comercial',
      userRole: 'COMMERCIAL',
      resource: 'ECONOMIC_RESULT',
      offerId: '1',
      action: 'UPDATE',
      description: 'Ajuste da margem líquida alvo de 7,5% para 8,0%',
      diffs: [
        { field: 'targetMarginPercent', previousValue: 7.5, newValue: 8.0 },
        { field: 'bdiMultiplier', previousValue: 1.285, newValue: 1.294 },
      ],
    },
  ];

  /**
   * Registra um novo evento imutável na trilha de auditoria (RF-65, RNF-12).
   */
  logEvent(eventInput: Omit<AuditEvent, 'id' | 'timestamp'>): AuditEvent {
    const event: AuditEvent = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...eventInput,
    };

    this.events.unshift(event); // Mais recentes primeiro
    return event;
  }

  /**
   * Consulta a trilha de auditoria com suporte a múltiplos filtros (RF-65).
   */
  getEvents(filter?: AuditFilter): AuditEvent[] {
    if (!filter) {
      return this.events;
    }

    return this.events.filter((evt) => {
      if (filter.offerId && evt.offerId !== filter.offerId) {
        return false;
      }
      if (filter.resource && evt.resource !== filter.resource) {
        return false;
      }
      if (filter.userId && evt.userId !== filter.userId) {
        return false;
      }
      if (filter.action && evt.action !== filter.action) {
        return false;
      }
      if (
        filter.startDate &&
        new Date(evt.timestamp) < new Date(filter.startDate)
      ) {
        return false;
      }
      if (
        filter.endDate &&
        new Date(evt.timestamp) > new Date(filter.endDate)
      ) {
        return false;
      }
      return true;
    });
  }

  /**
   * Limpa eventos para execução isolada de testes.
   */
  clearEvents(): void {
    this.events = [];
  }
}
