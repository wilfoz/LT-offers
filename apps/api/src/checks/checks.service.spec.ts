import { Test, TestingModule } from '@nestjs/testing';
import { ChecksService } from './checks.service';
import { PrismaService } from '../app/prisma.service';

describe('ChecksService', () => {
  let service: ChecksService;
  let mockPrismaService: any;

  beforeEach(async () => {
    mockPrismaService = {
      offer: {
        findUnique: jest.fn().mockResolvedValue({
          id: 1,
          name: 'Oferta Lote 1 - Leilão 01/2026',
          revisions: [
            {
              id: 1,
              revisionNumber: 0,
              transmissionLines: [
                {
                  id: 10,
                  name: 'LT 500kV Trecho A',
                  refinedLengthKm: '100.00',
                  reportLengthKm: '100.00',
                },
              ],
            },
          ],
        }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChecksService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ChecksService>(ChecksService);
  });

  it('deve executar a verificação de saúde da oferta e retornar o sumário', async () => {
    const summary = await service.runOfferChecks(1);
    expect(summary.offerId).toBe('1');
    expect(summary.status).toBeDefined();
    expect(summary.canCloseRevision).toBeDefined();
  });

  it('deve lançar NotFoundException se a oferta não for encontrada', async () => {
    mockPrismaService.offer.findUnique.mockResolvedValueOnce(null);
    await expect(service.runOfferChecks(999)).rejects.toThrow();
  });
});
