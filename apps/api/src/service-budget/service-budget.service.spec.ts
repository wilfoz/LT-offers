import { Test, TestingModule } from '@nestjs/testing';
import { ServiceBudgetService } from './service-budget.service';
import { PrismaService } from '../app/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('ServiceBudgetService (NestJS)', () => {
  let service: ServiceBudgetService;

  const mockPrismaService = {
    transmissionLine: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceBudgetService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ServiceBudgetService>(ServiceBudgetService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return service budget summary for a valid transmission line', async () => {
    mockPrismaService.transmissionLine.findUnique.mockResolvedValue({
      id: 1,
      name: 'LT 500 kV Teste',
      refinedLengthKm: '100.00',
      reportLengthKm: '100.00',
      offerRevision: {
        id: 10,
        offerId: 100,
        offer: { id: 100, name: 'Oferta 100' },
      },
    });

    const result = await service.getLineServiceBudget(1);

    expect(result).toBeDefined();
    expect(result.lineId).toBe('1');
    expect(result.items.length).toBe(6);
    expect(Number(result.totalDirectCost)).toBeGreaterThan(0);
    expect(Number(result.totalSalePrice)).toBeGreaterThan(Number(result.totalDirectCost));
    expect(result.ratios.costPerKm).toBeDefined();
  });

  it('should throw NotFoundException if line does not exist', async () => {
    mockPrismaService.transmissionLine.findUnique.mockResolvedValue(null);

    await expect(service.getLineServiceBudget(999)).rejects.toThrow(NotFoundException);
  });
});
