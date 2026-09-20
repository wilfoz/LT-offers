import { Injectable } from '@nestjs/common';
import { ServiceBudgetItem } from '@lt-offers/domain';
import { GetLineServiceBudgetUseCase } from './get-line-service-budget.usecase';

@Injectable()
export class GetLineMeasurementSheetUseCase {
  constructor(
    private readonly getLineServiceBudget: GetLineServiceBudgetUseCase,
  ) {}

  /**
   * Folha de medição da linha: os itens do orçamento de serviços.
   */
  async execute(lineId: number): Promise<ServiceBudgetItem[]> {
    const summary = await this.getLineServiceBudget.execute(lineId);
    return summary.items;
  }
}
