import { Test, TestingModule } from '@nestjs/testing';
import { CashflowService } from './cashflow.service';
import { PrismaService } from '../app/prisma.service';

describe('CashflowService (NestJS)', () => {
  let service: CashflowService;

  const mockPrismaService = {
    transmissionLine: {
      findUnique: jest.fn(),
    },
    offer: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CashflowService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CashflowService>(CashflowService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should calculate cashflow for a transmission line', async () => {
    mockPrismaService.transmissionLine.findUnique.mockResolvedValue({
      id: 1,
      name: 'LT 500 kV Linha 1',
      refinedLengthKm: '100.00',
      offerRevision: {
        id: 10,
        offerId: 100,
        offer: { id: 100, name: 'Oferta 100' },
      },
    });

    const result = await service.getLineCashflow(1);

    expect(result).toBeDefined();
    expect(result.monthlyPoints.length).toBe(18);
    expect(Number(result.totalInflow)).toBeGreaterThan(0);
    expect(Number(result.totalOutflow)).toBeGreaterThan(0);
    expect(result.financialExposure).toBeDefined();
  });

  it('should calculate consolidated cashflow for an offer', async () => {
    mockPrismaService.offer.findUnique.mockResolvedValue({
      id: 100,
      name: 'Oferta 100',
      revisions: [
        {
          id: 10,
          isCurrent: true,
          transmissionLines: [
            { id: 1, name: 'LT 1', refinedLengthKm: '100' },
            { id: 2, name: 'LT 2', refinedLengthKm: '80' },
          ],
        },
      ],
    });
    mockPrismaService.transmissionLine.findUnique.mockImplementation(({ where }) => {
      return Promise.resolve({
        id: where.id,
        name: `LT ${where.id}`,
        refinedLengthKm: '100',
        offerRevision: { id: 10, offerId: 100, offer: { id: 100 } },
      });
    });

    const result = await service.getConsolidatedCashflow(100);

    expect(result).toBeDefined();
    expect(result.monthlyPoints.length).toBe(18);
    expect(result.financialExposure.recommendedWorkingCapital).toBeDefined();
  });
});
