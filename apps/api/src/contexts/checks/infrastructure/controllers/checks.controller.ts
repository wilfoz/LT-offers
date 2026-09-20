import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { OfferHealthSummary } from '@lt-offers/domain';
import { RunOfferChecksUseCase } from '../../application/usecases';
import { OfferChecksNotFoundException } from '../../domain';

@Controller('offers/:offerId/checks')
export class ChecksController {
  constructor(private readonly runOfferChecksUseCase: RunOfferChecksUseCase) {}

  @Get()
  async getHealthChecks(
    @Param('offerId', ParseIntPipe) offerId: number,
  ): Promise<OfferHealthSummary> {
    try {
      return await this.runOfferChecksUseCase.execute(offerId);
    } catch (err) {
      if (err instanceof OfferChecksNotFoundException) {
        throw new NotFoundException(err.message);
      }
      throw err;
    }
  }
}
