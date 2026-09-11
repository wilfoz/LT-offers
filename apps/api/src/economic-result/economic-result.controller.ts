import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { EconomicResultService } from './economic-result.service';
import {
  EconomicResultSummary,
  MarginSimulationInput,
  MarginSimulationOutput,
  RevisionComparisonResult,
  SaleCoefficients,
  UserProfile,
  canViewSensitiveCommercialData,
} from '@lt-offers/domain';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser, RequireScopes, Roles, Audited } from '../auth/auth.decorators';

@Controller()
@UseGuards(RolesGuard)
export class EconomicResultController {
  constructor(private readonly economicResultService: EconomicResultService) {}

  private maskSensitiveEconomicData(
    summary: EconomicResultSummary,
    user: UserProfile
  ): EconomicResultSummary {
    if (canViewSensitiveCommercialData(user)) {
      return summary;
    }

    // Mascaramento de dados confidenciais para perfis técnicos (RNF-17)
    return {
      ...summary,
      totalSalePrice: '0.00',
      grossProfit: '0.00',
      grossMarginPercent: '0.00',
      netMarginPercent: '0.00',
      bdi: undefined,
      coefficients: undefined,
    };
  }

  @Get('lines/:lineId/economic-result')
  @RequireScopes('OFFER_READ')
  async getLineEconomicResult(
    @Param('lineId', ParseIntPipe) lineId: number,
    @CurrentUser() user: UserProfile
  ): Promise<EconomicResultSummary> {
    const result = await this.economicResultService.getLineEconomicResult(lineId);
    return this.maskSensitiveEconomicData(result, user);
  }

  @Post('lines/:lineId/economic-result')
  @RequireScopes('COMMERCIAL_WRITE')
  @Audited({ resource: 'ECONOMIC_RESULT', action: 'UPDATE', description: 'Recálculo de coeficientes comerciais da linha' })
  async calculateLineWithCustomCoefficients(
    @Param('lineId', ParseIntPipe) lineId: number,
    @Body() customCoeffs: Partial<SaleCoefficients>,
    @CurrentUser() user: UserProfile
  ): Promise<EconomicResultSummary> {
    const result = await this.economicResultService.getLineEconomicResult(lineId, customCoeffs);
    return this.maskSensitiveEconomicData(result, user);
  }

  @Get('offers/:offerId/economic-result/consolidated')
  @RequireScopes('OFFER_READ')
  async getConsolidatedEconomicResult(
    @Param('offerId', ParseIntPipe) offerId: number,
    @CurrentUser() user: UserProfile
  ): Promise<EconomicResultSummary> {
    const result = await this.economicResultService.getConsolidatedEconomicResult(offerId);
    return this.maskSensitiveEconomicData(result, user);
  }

  @Post('offers/:offerId/economic-result/simulate')
  @RequireScopes('COMMERCIAL_WRITE')
  @Audited({ resource: 'ECONOMIC_RESULT', action: 'SIMULATE', description: 'Simulação interativa de preço e margem comercial' })
  async simulateMarginOrPrice(
    @Param('offerId', ParseIntPipe) offerId: number,
    @Body() simInput: MarginSimulationInput,
    @Query('lineId') lineId?: string
  ): Promise<MarginSimulationOutput> {
    const parsedLineId = lineId ? parseInt(lineId, 10) : undefined;
    return this.economicResultService.simulateMarginOrPrice(offerId, simInput, parsedLineId);
  }

  @Get('offers/:offerId/economic-result/compare')
  @RequireScopes('COMMERCIAL_READ_SENSITIVE')
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
