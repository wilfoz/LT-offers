import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { OfferHealthSummary } from '@lt-offers/domain';
import { ChecksService } from './checks.service';

@Controller('offers/:offerId/checks')
export class ChecksController {
  constructor(private readonly checksService: ChecksService) {}

  @Get()
  async getHealthChecks(
    @Param('offerId', ParseIntPipe) offerId: number
  ): Promise<OfferHealthSummary> {
    return this.checksService.runOfferChecks(offerId);
  }
}
