import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ResourceHistogramSummary } from '@lt-offers/domain';
import {
  GetLineHistogramUseCase,
  GetOfferConsolidatedHistogramUseCase,
} from '../../application/usecases';
import { OfferHistogramNotFoundException } from '../../domain';
import { LineScheduleNotFoundException } from '../../../schedule';

@Controller()
export class HistogramController {
  constructor(
    private readonly getLineHistogramUseCase: GetLineHistogramUseCase,
    private readonly getOfferConsolidatedHistogramUseCase: GetOfferConsolidatedHistogramUseCase,
  ) {}

  @Get('lines/:lineId/histograms/resources')
  async getLineHistogram(
    @Param('lineId', ParseIntPipe) lineId: number,
  ): Promise<ResourceHistogramSummary> {
    try {
      return await this.getLineHistogramUseCase.execute(lineId);
    } catch (err) {
      if (err instanceof LineScheduleNotFoundException) {
        throw new NotFoundException(err.message);
      }
      throw err;
    }
  }

  @Get('offers/:offerId/histograms/consolidated')
  async getOfferConsolidatedHistogram(
    @Param('offerId', ParseIntPipe) offerId: number,
  ): Promise<ResourceHistogramSummary> {
    try {
      return await this.getOfferConsolidatedHistogramUseCase.execute(offerId);
    } catch (err) {
      if (err instanceof OfferHistogramNotFoundException) {
        throw new NotFoundException(err.message);
      }
      throw err;
    }
  }
}
