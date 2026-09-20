import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ServiceBudgetService } from './service-budget.service';
import { ServiceBudgetSummary, ServiceBudgetItem } from '@lt-offers/domain';

@Controller('lines/:lineId/services')
export class ServiceBudgetController {
  constructor(private readonly serviceBudgetService: ServiceBudgetService) {}

  @Get('summary')
  async getServiceBudget(
    @Param('lineId', ParseIntPipe) lineId: number,
  ): Promise<ServiceBudgetSummary> {
    return this.serviceBudgetService.getLineServiceBudget(lineId);
  }

  @Get('measurement-sheet')
  async getMeasurementSheet(
    @Param('lineId', ParseIntPipe) lineId: number,
  ): Promise<ServiceBudgetItem[]> {
    return this.serviceBudgetService.getLineMeasurementSheet(lineId);
  }
}
