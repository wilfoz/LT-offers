import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ElectromechanicalService } from './electromechanical.service';
import {
  ElectromechanicalSummary,
  TowerTraceabilityDetail,
} from '@lt-offers/domain';

@Controller('lines/:lineId/electromechanical')
export class ElectromechanicalController {
  constructor(
    private readonly electromechanicalService: ElectromechanicalService,
  ) {}

  @Get('summary')
  async getSummary(
    @Param('lineId', ParseIntPipe) lineId: number,
  ): Promise<ElectromechanicalSummary> {
    return this.electromechanicalService.calculateLineElectromechanical(lineId);
  }

  @Get('traceability')
  async getTraceability(
    @Param('lineId', ParseIntPipe) lineId: number,
  ): Promise<TowerTraceabilityDetail[]> {
    return this.electromechanicalService.getLineElectromechanicalTraceability(
      lineId,
    );
  }
}
