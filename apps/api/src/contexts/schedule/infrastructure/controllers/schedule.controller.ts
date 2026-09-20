import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ScheduleSummary, CampCostSummary } from '@lt-offers/domain';
import {
  GetLineScheduleUseCase,
  GetLineCampsUseCase,
} from '../../application/usecases';
import { LineScheduleNotFoundException } from '../../domain';

@Controller('lines/:lineId/schedule')
export class ScheduleController {
  constructor(
    private readonly getLineScheduleUseCase: GetLineScheduleUseCase,
    private readonly getLineCampsUseCase: GetLineCampsUseCase,
  ) {}

  @Get('summary')
  async getSummary(
    @Param('lineId', ParseIntPipe) lineId: number,
  ): Promise<ScheduleSummary> {
    try {
      return await this.getLineScheduleUseCase.execute(lineId);
    } catch (err) {
      if (err instanceof LineScheduleNotFoundException) {
        throw new NotFoundException(err.message);
      }
      throw err;
    }
  }

  @Get('camps')
  async getCamps(
    @Param('lineId', ParseIntPipe) lineId: number,
  ): Promise<CampCostSummary> {
    try {
      return await this.getLineCampsUseCase.execute(lineId);
    } catch (err) {
      if (err instanceof LineScheduleNotFoundException) {
        throw new NotFoundException(err.message);
      }
      throw err;
    }
  }
}
