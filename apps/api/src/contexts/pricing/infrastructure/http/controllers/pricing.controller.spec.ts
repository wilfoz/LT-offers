import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { LineMaterialPricingSummary, MaterialQuote } from '@lt-offers/domain';
import { TransmissionLineNotFoundException } from '../../../domain';
import { CalculateLinePricingUseCase } from '../../../application/usecases/calculate-line-pricing.usecase';
import { GetQuotesUseCase } from '../../../application/usecases/get-quotes.usecase';
import { PricingController } from './pricing.controller';

describe('PricingController (contratos de /api/lines/:lineId/pricing)', () => {
  let controller: PricingController;
  let calculateMock: { execute: jest.Mock };
  let getQuotesMock: { execute: jest.Mock };

  const summary = {
    lineId: '1',
    taxRegime: 'STANDARD',
  } as unknown as LineMaterialPricingSummary;

  beforeEach(async () => {
    calculateMock = { execute: jest.fn().mockResolvedValue(summary) };
    getQuotesMock = { execute: jest.fn().mockReturnValue([]) };

    const moduleRef = await Test.createTestingModule({
      controllers: [PricingController],
      providers: [
        { provide: CalculateLinePricingUseCase, useValue: calculateMock },
        { provide: GetQuotesUseCase, useValue: getQuotesMock },
      ],
    }).compile();

    controller = moduleRef.get(PricingController);
  });

  it('GET summary deve delegar o cálculo sem opções de simulação', async () => {
    const result = await controller.getLinePricingSummary(1);
    expect(calculateMock.execute).toHaveBeenCalledWith(1);
    expect(result).toBe(summary);
  });

  it('POST simulate deve repassar as opções de simulação recebidas', async () => {
    const options = { taxRegime: 'REIDI' as const, spotLmeUsdPerTon: 2800 };
    await controller.simulateLinePricing(1, options);
    expect(calculateMock.execute).toHaveBeenCalledWith(1, options);
  });

  it('deve converter exceção de domínio em 404 com mensagem em português', async () => {
    calculateMock.execute.mockRejectedValue(
      new TransmissionLineNotFoundException(99),
    );

    await expect(controller.getLinePricingSummary(99)).rejects.toThrow(
      NotFoundException,
    );
    await expect(controller.getLinePricingSummary(99)).rejects.toThrow(
      'Linha de transmissão com ID 99 não encontrada',
    );
  });

  it('GET quotes deve retornar a lista de cotações do caso de uso', async () => {
    const quotes = [{ materialCode: 'MAT-TOR-EST' }] as MaterialQuote[];
    getQuotesMock.execute.mockReturnValue(quotes);
    await expect(controller.getAvailableQuotes()).resolves.toBe(quotes);
  });
});
