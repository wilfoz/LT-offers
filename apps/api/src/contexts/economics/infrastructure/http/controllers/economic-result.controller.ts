import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  EconomicResultSummary,
  MarginSimulationInput,
  MarginSimulationOutput,
  RevisionComparisonResult,
  SaleCoefficients,
  UserProfile,
} from '@lt-offers/domain';
import { RolesGuard } from '../../../../../auth/roles.guard';
import {
  CurrentUser,
  RequireScopes,
  Audited,
} from '../../../../../auth/auth.decorators';
import {
  EconomicsLineNotFoundException,
  EconomicsOfferNotFoundException,
  maskEconomicResult,
} from '../../../domain';
import { GetLineEconomicResultUseCase } from '../../../application/usecases/get-line-economic-result.usecase';
import { GetConsolidatedEconomicResultUseCase } from '../../../application/usecases/get-consolidated-economic-result.usecase';
import { SimulateMarginOrPriceUseCase } from '../../../application/usecases/simulate-margin-or-price.usecase';
import { CompareRevisionsUseCase } from '../../../application/usecases/compare-revisions.usecase';

@Controller()
@UseGuards(RolesGuard)
export class EconomicResultController {
  constructor(
    private readonly getLineEconomicResultUseCase: GetLineEconomicResultUseCase,
    private readonly getConsolidatedUseCase: GetConsolidatedEconomicResultUseCase,
    private readonly simulateUseCase: SimulateMarginOrPriceUseCase,
    private readonly compareUseCase: CompareRevisionsUseCase,
  ) {}

  @Get('lines/:lineId/economic-result')
  @RequireScopes('OFFER_READ')
  async getLineEconomicResult(
    @Param('lineId', ParseIntPipe) lineId: number,
    @CurrentUser() user: UserProfile,
  ): Promise<EconomicResultSummary> {
    try {
      const result = await this.getLineEconomicResultUseCase.execute(lineId);
      return maskEconomicResult(result, user);
    } catch (err) {
      if (err instanceof EconomicsLineNotFoundException) {
        throw new NotFoundException(err.message);
      }
      throw err;
    }
  }

  @Post('lines/:lineId/economic-result')
  @RequireScopes('COMMERCIAL_WRITE')
  @Audited({
    resource: 'ECONOMIC_RESULT',
    action: 'UPDATE',
    description: 'Recálculo de coeficientes comerciais da linha',
  })
  async calculateLineWithCustomCoefficients(
    @Param('lineId', ParseIntPipe) lineId: number,
    @Body() customCoeffs: Partial<SaleCoefficients>,
    @CurrentUser() user: UserProfile,
  ): Promise<EconomicResultSummary> {
    try {
      const result = await this.getLineEconomicResultUseCase.execute(
        lineId,
        customCoeffs,
      );
      return maskEconomicResult(result, user);
    } catch (err) {
      if (err instanceof EconomicsLineNotFoundException) {
        throw new NotFoundException(err.message);
      }
      throw err;
    }
  }

  @Get('offers/:offerId/economic-result/consolidated')
  @RequireScopes('OFFER_READ')
  async getConsolidatedEconomicResult(
    @Param('offerId', ParseIntPipe) offerId: number,
    @CurrentUser() user: UserProfile,
  ): Promise<EconomicResultSummary> {
    try {
      const result = await this.getConsolidatedUseCase.execute(offerId);
      return maskEconomicResult(result, user);
    } catch (err) {
      if (
        err instanceof EconomicsOfferNotFoundException ||
        err instanceof EconomicsLineNotFoundException
      ) {
        throw new NotFoundException(err.message);
      }
      throw err;
    }
  }

  @Post('offers/:offerId/economic-result/simulate')
  @RequireScopes('COMMERCIAL_WRITE')
  @Audited({
    resource: 'ECONOMIC_RESULT',
    action: 'SIMULATE',
    description: 'Simulação interativa de preço e margem comercial',
  })
  async simulateMarginOrPrice(
    @Param('offerId', ParseIntPipe) offerId: number,
    @Body() simInput: MarginSimulationInput,
    @Query('lineId') lineId?: string,
  ): Promise<MarginSimulationOutput> {
    const parsedLineId = lineId ? parseInt(lineId, 10) : undefined;
    try {
      return await this.simulateUseCase.execute(
        offerId,
        simInput,
        parsedLineId,
      );
    } catch (err) {
      if (
        err instanceof EconomicsOfferNotFoundException ||
        err instanceof EconomicsLineNotFoundException
      ) {
        throw new NotFoundException(err.message);
      }
      throw err;
    }
  }

  @Get('offers/:offerId/economic-result/compare')
  @RequireScopes('COMMERCIAL_READ_SENSITIVE')
  async compareRevisions(
    @Param('offerId', ParseIntPipe) offerId: number,
    @Query('baseRev') baseRev: string,
    @Query('targetRev') targetRev: string,
  ): Promise<RevisionComparisonResult> {
    const base = baseRev ? parseInt(baseRev, 10) : 0;
    const target = targetRev ? parseInt(targetRev, 10) : 1;
    try {
      return await this.compareUseCase.execute(offerId, base, target);
    } catch (err) {
      if (
        err instanceof EconomicsOfferNotFoundException ||
        err instanceof EconomicsLineNotFoundException
      ) {
        throw new NotFoundException(err.message);
      }
      throw err;
    }
  }
}
