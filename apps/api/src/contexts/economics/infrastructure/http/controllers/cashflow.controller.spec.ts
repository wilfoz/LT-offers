import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CashflowSummary } from '@lt-offers/domain';
import {
  EconomicsLineNotFoundException,
  EconomicsOfferNotFoundException,
} from '../../../domain';
import { GetLineCashflowUseCase } from '../../../application/usecases/get-line-cashflow.usecase';
import { GetConsolidatedCashflowUseCase } from '../../../application/usecases/get-consolidated-cashflow.usecase';
import { CashflowController } from './cashflow.controller';

describe('CashflowController (contratos das rotas de fluxo de caixa)', () => {
  let controller: CashflowController;
  let lineMock: { execute: jest.Mock };
  let consolidatedMock: { execute: jest.Mock };

  const summary = { offerId: '100' } as unknown as CashflowSummary;

  beforeEach(async () => {
    lineMock = { execute: jest.fn().mockResolvedValue(summary) };
    consolidatedMock = { execute: jest.fn().mockResolvedValue(summary) };

    const moduleRef = await Test.createTestingModule({
      controllers: [CashflowController],
      providers: [
        { provide: GetLineCashflowUseCase, useValue: lineMock },
        {
          provide: GetConsolidatedCashflowUseCase,
          useValue: consolidatedMock,
        },
      ],
    }).compile();

    controller = moduleRef.get(CashflowController);
  });

  it('GET lines/:lineId/cashflow deve converter os query params numéricos', async () => {
    await controller.getLineCashflow(1, '20', '5', '2');
    expect(lineMock.execute).toHaveBeenCalledWith(1, {
      advanceRate: 20,
      retentionRate: 5,
      billingLag: 2,
    });
  });

  it('deve repassar undefined quando os query params não são informados', async () => {
    await controller.getLineCashflow(1);
    expect(lineMock.execute).toHaveBeenCalledWith(1, {
      advanceRate: undefined,
      retentionRate: undefined,
      billingLag: undefined,
    });
  });

  it('deve converter exceção de linha em 404 com mensagem em português', async () => {
    lineMock.execute.mockRejectedValue(new EconomicsLineNotFoundException(99));

    await expect(controller.getLineCashflow(99)).rejects.toThrow(
      NotFoundException,
    );
    await expect(controller.getLineCashflow(99)).rejects.toThrow(
      'Linha de transmissão ID 99 não encontrada.',
    );
  });

  it('deve converter exceção de oferta em 404 no consolidado', async () => {
    consolidatedMock.execute.mockRejectedValue(
      new EconomicsOfferNotFoundException(999),
    );

    await expect(controller.getConsolidatedCashflow(999)).rejects.toThrow(
      NotFoundException,
    );
    await expect(controller.getConsolidatedCashflow(999)).rejects.toThrow(
      'Oferta ID 999 não encontrada.',
    );
  });
});
