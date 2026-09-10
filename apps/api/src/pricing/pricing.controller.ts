import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { PricingService, PricingSimulationOptions } from './pricing.service';

@Controller('lines/:lineId/pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get('summary')
  async getLinePricingSummary(@Param('lineId', ParseIntPipe) lineId: number) {
    return this.pricingService.calculateLinePricing(lineId);
  }

  @Post('simulate')
  async simulateLinePricing(
    @Param('lineId', ParseIntPipe) lineId: number,
    @Body() options: PricingSimulationOptions,
  ) {
    return this.pricingService.calculateLinePricing(lineId, options);
  }

  @Get('quotes')
  async getAvailableQuotes() {
    return this.pricingService.getQuotes();
  }
}
