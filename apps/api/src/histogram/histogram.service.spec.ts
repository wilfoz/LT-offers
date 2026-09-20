import { HistogramService } from './histogram.service';
import { ScheduleService } from '../schedule/schedule.service';
import { PrismaService } from '../app/prisma.service';

describe('HistogramService (M08, RF-42..RF-45, RN-17)', () => {
  let service: HistogramService;
  let scheduleService: ScheduleService;
  let prismaMock: {
    transmissionLine: {
      findUnique: jest.Mock;
    };
    offer: {
      findUnique: jest.Mock;
    };
  };

  beforeEach(() => {
    prismaMock = {
      transmissionLine: {
        findUnique: jest.fn().mockResolvedValue({
          id: 1,
          name: 'LT 500 kV Poções III - Padre Paraíso C1',
          code: 'LT-500-01',
          refinedLengthKm: '100.0',
          reportLengthKm: '100.0',
          offerRevision: {
            offer: {
              code: 'OFR-001',
            },
          },
        }),
      },
      offer: {
        findUnique: jest.fn().mockResolvedValue({
          id: 10,
          code: 'OFR-001',
          revisions: [
            {
              id: 1,
              transmissionLines: [{ id: 1, name: 'LT 500 kV Linha 1' }],
            },
          ],
        }),
      },
    };

    scheduleService = new ScheduleService(
      prismaMock as unknown as PrismaService,
    );
    service = new HistogramService(
      scheduleService,
      prismaMock as unknown as PrismaService,
    );
  });

  it('deve gerar o histograma de recursos da linha com separação de direto/indireto e balanço de frota', async () => {
    const histogram = await service.getLineHistogram(1);

    expect(histogram.lineId).toBe(1);
    expect(histogram.totalMonths).toBeGreaterThanOrEqual(12);
    expect(histogram.manpowerItems.length).toBeGreaterThan(0);
    expect(histogram.equipmentItems.length).toBeGreaterThan(0);
    expect(histogram.peakManpower.total).toBeGreaterThan(0);
    expect(histogram.peakManpower.drivingActivities.length).toBeGreaterThan(0);
    expect(histogram.monthlyTimeline.length).toBeGreaterThan(0);
  });

  it('deve consolidar o histograma de recursos para toda a oferta', async () => {
    const consolidated = await service.getOfferConsolidatedHistogram(10);

    expect(consolidated.totalMonths).toBeGreaterThanOrEqual(12);
    expect(consolidated.manpowerItems.length).toBeGreaterThan(0);
    expect(consolidated.equipmentItems.length).toBeGreaterThan(0);
  });
});
