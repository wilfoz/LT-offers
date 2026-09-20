import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import {
  PricingSimulationOptions,
  TransmissionLineNotFoundException,
} from '../../../domain';
import { CalculateLinePricingUseCase } from '../../../application/usecases/calculate-line-pricing.usecase';
import { GetQuotesUseCase } from '../../../application/usecases/get-quotes.usecase';

@Controller('lines/:lineId/pricing')
export class PricingController {
  constructor(
    private readonly calculateUseCase: CalculateLinePricingUseCase,
    private readonly getQuotesUseCase: GetQuotesUseCase,
  ) {}

  @Get('summary')
  async getLinePricingSummary(@Param('lineId', ParseIntPipe) lineId: number) {
    try {
      return await this.calculateUseCase.execute(lineId);
    } catch (err) {
      if (err instanceof TransmissionLineNotFoundException) {
        throw new NotFoundException(err.message);
      }
      throw err;
    }
  }

  @Post('simulate')
  async simulateLinePricing(
    @Param('lineId', ParseIntPipe) lineId: number,
    @Body() options: PricingSimulationOptions,
  ) {
    try {
      return await this.calculateUseCase.execute(lineId, options);
    } catch (err) {
      if (err instanceof TransmissionLineNotFoundException) {
        throw new NotFoundException(err.message);
      }
      throw err;
    }
  }

  @Get('quotes')
  async getAvailableQuotes() {
    return this.getQuotesUseCase.execute();
  }
}
