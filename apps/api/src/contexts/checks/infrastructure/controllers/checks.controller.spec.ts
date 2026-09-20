import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { OfferHealthSummary } from '@lt-offers/domain';
import { ChecksController } from './checks.controller';
import { RunOfferChecksUseCase } from '../../application/usecases';
import { OfferChecksNotFoundException } from '../../domain';

describe('ChecksController', () => {
  let controller: ChecksController;
  let mockUseCase: Partial<Record<keyof RunOfferChecksUseCase, jest.Mock>>;

  const mockHealthSummary: OfferHealthSummary = {
    offerId: '1',
    status: 'HEALTHY',
    criticalCount: 0,
    warningCount: 0,
    infoCount: 0,
    findings: [],
    canCloseRevision: true,
    requiresJustification: false,
  };

  beforeEach(async () => {
    mockUseCase = {
      execute: jest.fn().mockResolvedValue(mockHealthSummary),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChecksController],
      providers: [
        {
          provide: RunOfferChecksUseCase,
          useValue: mockUseCase,
        },
      ],
    }).compile();

    controller = module.get<ChecksController>(ChecksController);
  });

  it('deve retornar o envelope completo de OfferHealthSummary por igualdade exata', async () => {
    const result = await controller.getHealthChecks(1);

    expect(result).toEqual({
      offerId: '1',
      status: 'HEALTHY',
      criticalCount: 0,
      warningCount: 0,
      infoCount: 0,
      findings: [],
      canCloseRevision: true,
      requiresJustification: false,
    });
    expect(mockUseCase.execute).toHaveBeenCalledWith(1);
  });

  it('deve converter OfferChecksNotFoundException em NotFoundException do NestJS', async () => {
    mockUseCase.execute!.mockRejectedValueOnce(
      new OfferChecksNotFoundException(999),
    );

    await expect(controller.getHealthChecks(999)).rejects.toThrow(
      NotFoundException,
    );
  });
});
