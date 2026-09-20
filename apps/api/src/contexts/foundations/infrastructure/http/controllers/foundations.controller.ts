import {
  FoundationCalculationResult,
  FoundationTraceabilityItem,
  FoundationVolumeQuantityField,
  LineFoundationSummary,
} from '@lt-offers/domain';
import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { LineFoundationsNotFoundException } from '../../../domain';
import {
  CalculateLineFoundationsUseCase,
  GetLineFoundationSummaryUseCase,
  GetLineFoundationTraceabilityUseCase,
  GetLineFoundationValidationUseCase,
} from '../../../application';
import {
  FoundationsPresenter,
  FoundationValidationResponseDto,
} from '../presenters/foundations.presenter';

@Controller('lines/:lineId/foundations')
export class FoundationsController {
  constructor(
    private readonly calculateUseCase: CalculateLineFoundationsUseCase,
    private readonly getSummaryUseCase: GetLineFoundationSummaryUseCase,
    private readonly getTraceabilityUseCase: GetLineFoundationTraceabilityUseCase,
    private readonly getValidationUseCase: GetLineFoundationValidationUseCase,
  ) {}

  @Get('quantities')
  async getQuantities(
    @Param('lineId', ParseIntPipe) lineId: number,
  ): Promise<LineFoundationSummary> {
    try {
      const summary = await this.getSummaryUseCase.execute(lineId);
      return FoundationsPresenter.toSummaryResponse(summary);
    } catch (err) {
      if (err instanceof LineFoundationsNotFoundException) {
        throw new NotFoundException(err.message);
      }
      throw err;
    }
  }

  @Get('traceability')
  async getTraceability(
    @Param('lineId', ParseIntPipe) lineId: number,
  ): Promise<
    Record<FoundationVolumeQuantityField, FoundationTraceabilityItem>
  > {
    try {
      const traceability = await this.getTraceabilityUseCase.execute(lineId);
      return FoundationsPresenter.toTraceabilityResponse(traceability);
    } catch (err) {
      if (err instanceof LineFoundationsNotFoundException) {
        throw new NotFoundException(err.message);
      }
      throw err;
    }
  }

  @Get('validation')
  async getValidation(
    @Param('lineId', ParseIntPipe) lineId: number,
  ): Promise<FoundationValidationResponseDto> {
    try {
      const diagnostic = await this.getValidationUseCase.execute(lineId);
      return FoundationsPresenter.toValidationResponse(diagnostic);
    } catch (err) {
      if (err instanceof LineFoundationsNotFoundException) {
        throw new NotFoundException(err.message);
      }
      throw err;
    }
  }

  @Get('full')
  async getFullCalculation(
    @Param('lineId', ParseIntPipe) lineId: number,
  ): Promise<FoundationCalculationResult> {
    try {
      const calculation = await this.calculateUseCase.execute(lineId);
      return FoundationsPresenter.toFullCalculationResponse(calculation);
    } catch (err) {
      if (err instanceof LineFoundationsNotFoundException) {
        throw new NotFoundException(err.message);
      }
      throw err;
    }
  }
}
