import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import {
  GetOfferRisksUseCase,
  SaveRiskUseCase,
  DeleteRiskUseCase,
} from '../../application/usecases';
import { RiskAssessmentSummary, RiskItem } from '../../domain';

@Controller('offers/:offerId/risks')
export class RisksController {
  constructor(
    private readonly getOfferRisksUseCase: GetOfferRisksUseCase,
    private readonly saveRiskUseCase: SaveRiskUseCase,
    private readonly deleteRiskUseCase: DeleteRiskUseCase,
  ) {}

  @Get()
  async getRisks(
    @Param('offerId') offerId: string,
    @Query('lineId') lineId?: string,
  ): Promise<RiskAssessmentSummary> {
    return this.getOfferRisksUseCase.execute(offerId, lineId);
  }

  @Post()
  async saveRisk(
    @Param('offerId') offerId: string,
    @Body() item: Partial<RiskItem>,
  ): Promise<RiskAssessmentSummary> {
    return this.saveRiskUseCase.execute(offerId, item);
  }

  @Delete(':riskId')
  async deleteRisk(
    @Param('offerId') offerId: string,
    @Param('riskId') riskId: string,
    @Query('lineId') lineId?: string,
  ): Promise<RiskAssessmentSummary> {
    return this.deleteRiskUseCase.execute(offerId, riskId, lineId);
  }
}
