import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { CashflowSummary } from '@lt-offers/domain';
import {
  EconomicsLineNotFoundException,
  EconomicsOfferNotFoundException,
} from '../../../domain';
import { GetLineCashflowUseCase } from '../../../application/usecases/get-line-cashflow.usecase';
import { GetConsolidatedCashflowUseCase } from '../../../application/usecases/get-consolidated-cashflow.usecase';

@Controller()
export class CashflowController {
  constructor(
    private readonly getLineCashflowUseCase: GetLineCashflowUseCase,
    private readonly getConsolidatedCashflowUseCase: GetConsolidatedCashflowUseCase,
  ) {}

  @Get('lines/:lineId/cashflow')
  async getLineCashflow(
    @Param('lineId', ParseIntPipe) lineId: number,
    @Query('advanceRate') advanceRate?: string,
    @Query('retentionRate') retentionRate?: string,
    @Query('billingLag') billingLag?: string,
  ): Promise<CashflowSummary> {
    const adv = advanceRate ? parseFloat(advanceRate) : undefined;
    const ret = retentionRate ? parseFloat(retentionRate) : undefined;
    const lag = billingLag ? parseInt(billingLag, 10) : undefined;
    try {
      return await this.getLineCashflowUseCase.execute(lineId, {
        advanceRate: adv,
        retentionRate: ret,
        billingLag: lag,
      });
    } catch (err) {
      if (err instanceof EconomicsLineNotFoundException) {
        throw new NotFoundException(err.message);
      }
      throw err;
    }
  }

  @Get('offers/:offerId/cashflow/consolidated')
  async getConsolidatedCashflow(
    @Param('offerId', ParseIntPipe) offerId: number,
    @Query('advanceRate') advanceRate?: string,
    @Query('retentionRate') retentionRate?: string,
    @Query('billingLag') billingLag?: string,
  ): Promise<CashflowSummary> {
    const adv = advanceRate ? parseFloat(advanceRate) : undefined;
    const ret = retentionRate ? parseFloat(retentionRate) : undefined;
    const lag = billingLag ? parseInt(billingLag, 10) : undefined;
    try {
      return await this.getConsolidatedCashflowUseCase.execute(offerId, {
        advanceRate: adv,
        retentionRate: ret,
        billingLag: lag,
      });
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
