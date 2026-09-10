import { Test, TestingModule } from '@nestjs/testing';
import { EconomicResultService } from './economic-result.service';
import { PrismaService } from '../app/prisma.service';

describe('EconomicResultService (NestJS)', () => {
  let service: EconomicResultService;

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
        EconomicResultService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<EconomicResultService>(EconomicResultService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should calculate economic result for a line', async () => {
    mockPrismaService.transmissionLine.findUnique.mockResolvedValue({
      id: 1,
      name: 'LT 500 kV Linha 1',
      refinedLengthKm: '80.00',
      offerRevision: {
        id: 10,
        offerId: 100,
        offer: { id: 100, name: 'Oferta 100' },
      },
    });

    const result = await service.getLineEconomicResult(1);

    expect(result).toBeDefined();
    expect(result.lines.length).toBeGreaterThanOrEqual(3);
    expect(Number(result.totalSalePrice)).toBeGreaterThan(Number(result.totalCostWithTaxes));
    expect(result.bdi).toBeDefined();
    expect(result.coefficients).toBeDefined();
  });

  it('should simulate margin and price for an offer', async () => {
    mockPrismaService.offer.findUnique.mockResolvedValue({
      id: 100,
      name: 'Oferta 100',
      revisions: [
        {
          id: 10,
          isCurrent: true,
          transmissionLines: [
            { id: 1, name: 'LT 1', refinedLengthKm: '100' },
          ],
        },
      ],
    });
    mockPrismaService.transmissionLine.findUnique.mockResolvedValue({
      id: 1,
      name: 'LT 1',
      refinedLengthKm: '100',
      offerRevision: { id: 10, offerId: 100, offer: { id: 100 } },
    });

    const sim = await service.simulateMarginOrPrice(100, { targetMarginRate: '10.00' });

    expect(sim).toBeDefined();
    expect(sim.resultingNetMarginRate).toBe('10.00');
    expect(Number(sim.simulatedSalePrice)).toBeGreaterThan(0);
  });
});
