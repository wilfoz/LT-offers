import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  CANONICAL_USERS,
  EconomicResultSummary,
  canViewSensitiveCommercialData,
} from '@lt-offers/domain';
import { AuthService } from '../../../../../auth/auth.service';
import { EconomicsLineNotFoundException } from '../../../domain';
import { GetLineEconomicResultUseCase } from '../../../application/usecases/get-line-economic-result.usecase';
import { GetConsolidatedEconomicResultUseCase } from '../../../application/usecases/get-consolidated-economic-result.usecase';
import { SimulateMarginOrPriceUseCase } from '../../../application/usecases/simulate-margin-or-price.usecase';
import { CompareRevisionsUseCase } from '../../../application/usecases/compare-revisions.usecase';
import { EconomicResultController } from './economic-result.controller';

describe('EconomicResultController (contratos e mascaramento RNF-17)', () => {
  let controller: EconomicResultController;
  let getLineMock: { execute: jest.Mock };

  const summary = {
    offerId: '100',
    lineName: 'LT 1',
    totalNetCost: '1000.00',
    totalSalePrice: '1500.00',
    grossProfit: '300.00',
    grossMarginPercent: '20.00',
    netMarginPercent: '8.00',
    bdi: {
      totalIndirectRate: '18.45',
      grossMarginRate: '8.00',
      effectiveBdiRate: '30.63',
      bdiMultiplier: '1.3063',
    },
    coefficients: { targetMarginRate: '8.00' },
  } as unknown as EconomicResultSummary;

  const commercialUser = CANONICAL_USERS.find((u) =>
    canViewSensitiveCommercialData(u),
  )!;
  const technicalUser = CANONICAL_USERS.find(
    (u) => !canViewSensitiveCommercialData(u),
  )!;

  beforeEach(async () => {
    getLineMock = { execute: jest.fn().mockResolvedValue(summary) };

    const moduleRef = await Test.createTestingModule({
      controllers: [EconomicResultController],
      providers: [
        { provide: GetLineEconomicResultUseCase, useValue: getLineMock },
        {
          provide: GetConsolidatedEconomicResultUseCase,
          useValue: { execute: jest.fn().mockResolvedValue(summary) },
        },
        {
          provide: SimulateMarginOrPriceUseCase,
          useValue: { execute: jest.fn() },
        },
        { provide: CompareRevisionsUseCase, useValue: { execute: jest.fn() } },
        { provide: AuthService, useValue: {} },
      ],
    }).compile();

    controller = moduleRef.get(EconomicResultController);
  });

  it('deve entregar o resumo integral para papel com permissão comercial sensível', async () => {
    const result = await controller.getLineEconomicResult(1, commercialUser);
    expect(result.totalSalePrice).toBe('1500.00');
    expect(result.bdi.effectiveBdiRate).toBe('30.63');
  });

  it('deve mascarar preço, margens e BDI para papel técnico', async () => {
    const result = await controller.getLineEconomicResult(1, technicalUser);
    expect(result.totalSalePrice).toBe('0.00');
    expect(result.grossMarginPercent).toBe('0.00');
    expect(result.bdi.effectiveBdiRate).toBe('0.00');
    expect(result.totalNetCost).toBe('1000.00');
  });

  it('deve repassar coeficientes customizados no recálculo da linha', async () => {
    const coeffs = { targetMarginRate: '12.00' };
    await controller.calculateLineWithCustomCoefficients(
      1,
      coeffs,
      commercialUser,
    );
    expect(getLineMock.execute).toHaveBeenCalledWith(1, coeffs);
  });

  it('deve converter exceção de domínio em 404 com mensagem em português', async () => {
    getLineMock.execute.mockRejectedValue(
      new EconomicsLineNotFoundException(99),
    );

    await expect(
      controller.getLineEconomicResult(99, commercialUser),
    ).rejects.toThrow(NotFoundException);
    await expect(
      controller.getLineEconomicResult(99, commercialUser),
    ).rejects.toThrow('Linha de transmissão ID 99 não encontrada.');
  });
});
