import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { CashflowService } from './cashflow.service';
import { CashflowSummary } from '@lt-offers/domain';

@Controller()
export class CashflowController {
  constructor(private readonly cashflowService: CashflowService) {}

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
    return this.cashflowService.getLineCashflow(lineId, {
      advanceRate: adv,
      retentionRate: ret,
      billingLag: lag,
    });
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
    return this.cashflowService.getConsolidatedCashflow(offerId, {
      advanceRate: adv,
      retentionRate: ret,
      billingLag: lag,
    });
  }
}
