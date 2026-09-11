import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { RiskAssessmentSummary, RiskItem } from '@lt-offers/domain';
import { RisksService } from './risks.service';

@Controller('offers/:offerId/risks')
export class RisksController {
  constructor(private readonly risksService: RisksService) {}

  @Get()
  getRisks(
    @Param('offerId') offerId: string,
    @Query('lineId') lineId?: string
  ): RiskAssessmentSummary {
    return this.risksService.getOfferRisks(offerId, lineId);
  }

  @Post()
  saveRisk(
    @Param('offerId') offerId: string,
    @Body() item: Partial<RiskItem>
  ): RiskAssessmentSummary {
    return this.risksService.saveRisk(offerId, item);
  }

  @Delete(':riskId')
  deleteRisk(
    @Param('offerId') offerId: string,
    @Param('riskId') riskId: string,
    @Query('lineId') lineId?: string
  ): RiskAssessmentSummary {
    return this.risksService.deleteRisk(offerId, riskId, lineId);
  }
}
