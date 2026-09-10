import { ScheduleService } from './schedule.service';
import { PrismaService } from '../app/prisma.service';

describe('ScheduleService (M07, RF-35..RF-41)', () => {
  let service: ScheduleService;
  let prismaMock: {
    transmissionLine: {
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
    };

    service = new ScheduleService(prismaMock as unknown as PrismaService);
  });

  it('deve retornar o cronograma físico da linha com atividades, durações e marcos', async () => {
    const summary = await service.getLineSchedule(1);

    expect(summary.lineId).toBe(1);
    expect(summary.activities.length).toBeGreaterThanOrEqual(5);
    expect(summary.milestones.length).toBe(2);
    expect(summary.totalDurationMonths).toBeGreaterThanOrEqual(12);
    expect(parseFloat(summary.totalScheduleCost)).toBeGreaterThan(0);
  });

  it('deve retornar a estrutura e dimensionamento de canteiros da linha', async () => {
    const camps = await service.getLineCamps(1);

    expect(camps.lineId).toBe(1);
    expect(camps.camps.length).toBeGreaterThanOrEqual(2);
    expect(parseFloat(camps.totalCampsCost)).toBeGreaterThan(0);
    expect(camps.monthlyDistribution.length).toBeGreaterThan(0);
  });
});
