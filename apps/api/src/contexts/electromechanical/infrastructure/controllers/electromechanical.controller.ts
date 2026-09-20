import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ElectromechanicalSummary,
  TowerTraceabilityDetail,
} from '@lt-offers/domain';
import {
  CalculateLineElectromechanicalUseCase,
  GetLineElectromechanicalTraceabilityUseCase,
} from '../../application/usecases';
import { LineElectromechanicalNotFoundException } from '../../domain';

@Controller('lines/:lineId/electromechanical')
export class ElectromechanicalController {
  constructor(
    private readonly calculateUseCase: CalculateLineElectromechanicalUseCase,
    private readonly traceabilityUseCase: GetLineElectromechanicalTraceabilityUseCase,
  ) {}

  @Get('summary')
  async getSummary(
    @Param('lineId', ParseIntPipe) lineId: number,
    @Query('referenceDate') referenceDate?: string,
  ): Promise<ElectromechanicalSummary> {
    try {
      const calculation = await this.calculateUseCase.execute(
        lineId,
        referenceDate,
      );
      return calculation.summary;
    } catch (err) {
      if (err instanceof LineElectromechanicalNotFoundException) {
        throw new NotFoundException(err.message);
      }
      throw err;
    }
  }

  @Get('traceability')
  async getTraceability(
    @Param('lineId', ParseIntPipe) lineId: number,
    @Query('referenceDate') referenceDate?: string,
  ): Promise<TowerTraceabilityDetail[]> {
    try {
      return await this.traceabilityUseCase.execute(lineId, referenceDate);
    } catch (err) {
      if (err instanceof LineElectromechanicalNotFoundException) {
        throw new NotFoundException(err.message);
      }
      throw err;
    }
  }
}
