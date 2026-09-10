import {
  FoundationCalculationResult,
  FoundationTraceabilityItem,
  FoundationVolumeQuantityField,
  LineFoundationSummary,
  MissingFoundationCombination,
} from '@lt-offers/domain';
import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { FoundationsService } from './foundations.service';

@Controller('lines/:lineId/foundations')
export class FoundationsController {
  constructor(private readonly service: FoundationsService) {}

  @Get('quantities')
  async getQuantities(
    @Param('lineId', ParseIntPipe) lineId: number,
  ): Promise<LineFoundationSummary> {
    return this.service.getLineFoundationSummary(lineId);
  }

  @Get('traceability')
  async getTraceability(
    @Param('lineId', ParseIntPipe) lineId: number,
  ): Promise<Record<FoundationVolumeQuantityField, FoundationTraceabilityItem>> {
    return this.service.getLineFoundationTraceability(lineId);
  }

  @Get('validation')
  async getValidation(
    @Param('lineId', ParseIntPipe) lineId: number,
  ): Promise<{
    transmissionLineId: number;
    totalTowers: number;
    calculatedTowers: number;
    pendingTowers: number;
    hasErrors: boolean;
    missingCombinations: MissingFoundationCombination[];
  }> {
    return this.service.getLineFoundationValidation(lineId);
  }

  @Get('full')
  async getFullCalculation(
    @Param('lineId', ParseIntPipe) lineId: number,
  ): Promise<FoundationCalculationResult> {
    return this.service.calculateFoundationsForLine(lineId);
  }
}
