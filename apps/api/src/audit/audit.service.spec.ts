import { AuditService } from './audit.service';
import { AuditEvent } from '@lt-offers/domain';

describe('AuditService', () => {
  let service: AuditService;

  beforeEach(() => {
    service = new AuditService();
    service.clearEvents();
  });

  it('registra evento imutável com timestamp e id gerados', () => {
    const event = service.logEvent({
      userId: 'user-eng-01',
      userName: 'Carlos Engenharia',
      userRole: 'ENGINEERING',
      resource: 'STAKING',
      offerId: '10',
      action: 'UPDATE',
      description: 'Alteração do tipo de fundação da torre T-12',
      diffs: [{ field: 'foundationType', previousValue: 'GRELHA', newValue: 'TUBULAÇÃO' }],
    });

    expect(event.id).toBeDefined();
    expect(event.timestamp).toBeDefined();
    expect(event.userId).toBe('user-eng-01');
    expect(event.diffs).toHaveLength(1);

    const allEvents = service.getEvents();
    expect(allEvents).toHaveLength(1);
    expect(allEvents[0].id).toBe(event.id);
  });

  it('filtra eventos por oferta, recurso e usuário', () => {
    service.logEvent({
      userId: 'user-comm-01',
      userName: 'Marcos Comercial',
      userRole: 'COMMERCIAL',
      resource: 'ECONOMIC_RESULT',
      offerId: '1',
      action: 'UPDATE',
      description: 'Ajuste de margem',
    });

    service.logEvent({
      userId: 'user-proc-01',
      userName: 'Ana Suprimentos',
      userRole: 'PROCUREMENT',
      resource: 'PRICING',
      offerId: '2',
      action: 'UPDATE',
      description: 'Atualização de cotação',
    });

    const offer1Events = service.getEvents({ offerId: '1' });
    expect(offer1Events).toHaveLength(1);
    expect(offer1Events[0].userId).toBe('user-comm-01');

    const pricingEvents = service.getEvents({ resource: 'PRICING' });
    expect(pricingEvents).toHaveLength(1);
    expect(pricingEvents[0].offerId).toBe('2');

    const userCommEvents = service.getEvents({ userId: 'user-comm-01' });
    expect(userCommEvents).toHaveLength(1);
  });
});
