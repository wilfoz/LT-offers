import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { ScheduleSummary, CampCostSummary } from '@lt-offers/domain';

@Controller('lines/:lineId/schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get('summary')
  async getSummary(
    @Param('lineId', ParseIntPipe) lineId: number
  ): Promise<ScheduleSummary> {
    return this.scheduleService.getLineSchedule(lineId);
  }

  @Get('camps')
  async getCamps(
    @Param('lineId', ParseIntPipe) lineId: number
  ): Promise<CampCostSummary> {
    return this.scheduleService.getLineCamps(lineId);
  }
}
