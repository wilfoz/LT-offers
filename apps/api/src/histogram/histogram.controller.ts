import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { HistogramService } from './histogram.service';
import { ResourceHistogramSummary } from '@lt-offers/domain';

@Controller()
export class HistogramController {
  constructor(private readonly histogramService: HistogramService) {}

  @Get('lines/:lineId/histograms/resources')
  async getLineHistogram(
    @Param('lineId', ParseIntPipe) lineId: number
  ): Promise<ResourceHistogramSummary> {
    return this.histogramService.getLineHistogram(lineId);
  }

  @Get('offers/:offerId/histograms/consolidated')
  async getOfferConsolidatedHistogram(
    @Param('offerId', ParseIntPipe) offerId: number
  ): Promise<ResourceHistogramSummary> {
    return this.histogramService.getOfferConsolidatedHistogram(offerId);
  }
}
