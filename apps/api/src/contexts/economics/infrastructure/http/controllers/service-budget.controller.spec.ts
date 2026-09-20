import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ServiceBudgetSummary, ServiceBudgetItem } from '@lt-offers/domain';
import { EconomicsLineNotFoundException } from '../../../domain';
import { GetLineServiceBudgetUseCase } from '../../../application/usecases/get-line-service-budget.usecase';
import { GetLineMeasurementSheetUseCase } from '../../../application/usecases/get-line-measurement-sheet.usecase';
import { ServiceBudgetController } from './service-budget.controller';

describe('ServiceBudgetController (contratos de /api/lines/:lineId/services)', () => {
  let controller: ServiceBudgetController;
  let budgetMock: { execute: jest.Mock };
  let sheetMock: { execute: jest.Mock };

  const summary = { lineId: '1', items: [] } as unknown as ServiceBudgetSummary;

  beforeEach(async () => {
    budgetMock = { execute: jest.fn().mockResolvedValue(summary) };
    sheetMock = { execute: jest.fn().mockResolvedValue([]) };

    const moduleRef = await Test.createTestingModule({
      controllers: [ServiceBudgetController],
      providers: [
        { provide: GetLineServiceBudgetUseCase, useValue: budgetMock },
        { provide: GetLineMeasurementSheetUseCase, useValue: sheetMock },
      ],
    }).compile();

    controller = moduleRef.get(ServiceBudgetController);
  });

  it('GET summary deve delegar ao caso de uso do orçamento', async () => {
    const result = await controller.getServiceBudget(1);
    expect(budgetMock.execute).toHaveBeenCalledWith(1);
    expect(result).toBe(summary);
  });

  it('GET measurement-sheet deve delegar ao caso de uso da folha de medição', async () => {
    const items = [{ cipCode: 'GR01.01.01' }] as ServiceBudgetItem[];
    sheetMock.execute.mockResolvedValue(items);
    await expect(controller.getMeasurementSheet(1)).resolves.toBe(items);
  });

  it('deve converter exceção de domínio em 404 com mensagem em português', async () => {
    budgetMock.execute.mockRejectedValue(
      new EconomicsLineNotFoundException(99),
    );

    await expect(controller.getServiceBudget(99)).rejects.toThrow(
      NotFoundException,
    );
    await expect(controller.getServiceBudget(99)).rejects.toThrow(
      'Linha de transmissão ID 99 não encontrada.',
    );
  });
});
