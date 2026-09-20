import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ServiceBudgetSummary, ServiceBudgetItem } from '@lt-offers/domain';
import { EconomicsLineNotFoundException } from '../../../domain';
import { GetLineServiceBudgetUseCase } from '../../../application/usecases/get-line-service-budget.usecase';
import { GetLineMeasurementSheetUseCase } from '../../../application/usecases/get-line-measurement-sheet.usecase';

@Controller('lines/:lineId/services')
export class ServiceBudgetController {
  constructor(
    private readonly getLineServiceBudget: GetLineServiceBudgetUseCase,
    private readonly getLineMeasurementSheet: GetLineMeasurementSheetUseCase,
  ) {}

  @Get('summary')
  async getServiceBudget(
    @Param('lineId', ParseIntPipe) lineId: number,
  ): Promise<ServiceBudgetSummary> {
    try {
      return await this.getLineServiceBudget.execute(lineId);
    } catch (err) {
      if (err instanceof EconomicsLineNotFoundException) {
        throw new NotFoundException(err.message);
      }
      throw err;
    }
  }

  @Get('measurement-sheet')
  async getMeasurementSheet(
    @Param('lineId', ParseIntPipe) lineId: number,
  ): Promise<ServiceBudgetItem[]> {
    try {
      return await this.getLineMeasurementSheet.execute(lineId);
    } catch (err) {
      if (err instanceof EconomicsLineNotFoundException) {
        throw new NotFoundException(err.message);
      }
      throw err;
    }
  }
}
