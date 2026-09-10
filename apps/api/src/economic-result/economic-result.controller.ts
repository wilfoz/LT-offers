import { Controller, Get, Post, Param, Body, Query, ParseIntPipe } from '@nestjs/common';
import { EconomicResultService } from './economic-result.service';
import {
  EconomicResultSummary,
  MarginSimulationInput,
  MarginSimulationOutput,
  RevisionComparisonResult,
  SaleCoefficients,
} from '@lt-offers/domain';

@Controller()
export class EconomicResultController {
  constructor(private readonly economicResultService: EconomicResultService) {}

  @Get('lines/:lineId/economic-result')
  async getLineEconomicResult(
    @Param('lineId', ParseIntPipe) lineId: number
  ): Promise<EconomicResultSummary> {
    return this.economicResultService.getLineEconomicResult(lineId);
  }

  @Post('lines/:lineId/economic-result')
  async calculateLineWithCustomCoefficients(
    @Param('lineId', ParseIntPipe) lineId: number,
    @Body() customCoeffs: Partial<SaleCoefficients>
  ): Promise<EconomicResultSummary> {
    return this.economicResultService.getLineEconomicResult(lineId, customCoeffs);
  }

  @Get('offers/:offerId/economic-result/consolidated')
  async getConsolidatedEconomicResult(
    @Param('offerId', ParseIntPipe) offerId: number
  ): Promise<EconomicResultSummary> {
    return this.economicResultService.getConsolidatedEconomicResult(offerId);
  }

  @Post('offers/:offerId/economic-result/simulate')
  async simulateMarginOrPrice(
    @Param('offerId', ParseIntPipe) offerId: number,
    @Body() simInput: MarginSimulationInput,
    @Query('lineId') lineId?: string
  ): Promise<MarginSimulationOutput> {
    const parsedLineId = lineId ? parseInt(lineId, 10) : undefined;
    return this.economicResultService.simulateMarginOrPrice(offerId, simInput, parsedLineId);
  }

  @Get('offers/:offerId/economic-result/compare')
  async compareRevisions(
    @Param('offerId', ParseIntPipe) offerId: number,
    @Query('baseRev') baseRev: string,
    @Query('targetRev') targetRev: string
  ): Promise<RevisionComparisonResult> {
    const base = baseRev ? parseInt(baseRev, 10) : 0;
    const target = targetRev ? parseInt(targetRev, 10) : 1;
    return this.economicResultService.compareRevisions(offerId, base, target);
  }
}
