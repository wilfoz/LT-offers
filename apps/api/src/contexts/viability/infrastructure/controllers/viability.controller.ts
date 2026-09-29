import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ViabilityAssessmentResponse,
  ViabilityParametersVersionItem,
} from '@lt-offers/domain';
import { CivilDate } from '../../../catalogs/domain/value-objects/civil-date.vo';
import { InvalidCivilDateException } from '../../../catalogs/domain';
import {
  resolveAuthor,
  resolveReferenceDate,
  versionImmutableException,
} from '../../../catalogs/infrastructure/http/controller-shared';
import {
  DuplicateViabilityParametersDateException,
  NoEffectiveViabilityParametersException,
  ViabilityRevisionNotFoundException,
} from '../../domain/exceptions/viability.exceptions';
import {
  CreateViabilityParametersVersionUseCase,
  GetEffectiveViabilityParametersUseCase,
  GetViabilityAssessmentUseCase,
} from '../../application/usecases';
import {
  CreateViabilityParametersVersionDto,
  ViabilityAssessmentQueryDto,
} from '../dto/viability-parameters.dto';

const logger = new Logger('ViabilityController');

/** Mapeia exceções de domínio da viabilidade para respostas HTTP (pt-BR). */
function handleViabilityError(error: unknown): never {
  if (error instanceof HttpException) {
    throw error;
  }
  if (
    error instanceof NoEffectiveViabilityParametersException ||
    error instanceof ViabilityRevisionNotFoundException
  ) {
    throw new NotFoundException(error.message);
  }
  if (error instanceof DuplicateViabilityParametersDateException) {
    throw new ConflictException(error.message);
  }
  if (error instanceof InvalidCivilDateException) {
    throw new BadRequestException(error.message);
  }
  // Erro não tipado é interno: loga a causa raiz e responde 500 pt-BR sem
  // vazar mensagem crua (RNF-14).
  logger.error(error);
  throw new InternalServerErrorException(
    'Erro interno ao processar a viabilidade do lote.',
  );
}

/**
 * Viabilidade do lote para o licitante (M13): parâmetros singleton
 * versionados por vigência (RNF-05) e parecer derivado em termos reais ao
 * WACC regulatório, comparado aos deságios praticados do snapshot local.
 */
@Controller('viability')
export class ViabilityController {
  constructor(
    private readonly getEffectiveParameters: GetEffectiveViabilityParametersUseCase,
    private readonly createParametersVersion: CreateViabilityParametersVersionUseCase,
    private readonly getAssessment: GetViabilityAssessmentUseCase,
  ) {}

  @Get('parameters')
  async getParameters(
    @Query('effectiveOn') effectiveOn?: string,
  ): Promise<ViabilityParametersVersionItem> {
    try {
      // Data de referência resolvida na borda (design D2); default = hoje.
      const referenceDate = resolveReferenceDate(effectiveOn);
      return await this.getEffectiveParameters.execute(
        referenceDate.toIsoDateString(),
      );
    } catch (error) {
      handleViabilityError(error);
    }
  }

  @Post('parameters')
  @HttpCode(HttpStatus.CREATED)
  async createParameters(
    @Body() dto: CreateViabilityParametersVersionDto,
    @Headers('x-user') user?: string,
  ): Promise<ViabilityParametersVersionItem> {
    try {
      // Round-trip de calendário na borda: rejeita 2027-02-30 sem rollover.
      const effectiveFrom = CivilDate.fromString(dto.effectiveFrom);
      return await this.createParametersVersion.execute(
        {
          effectiveFrom: effectiveFrom.toIsoDateString(),
          waccRealAfterTaxPercent: dto.waccRealAfterTaxPercent,
          concessionYears: dto.concessionYears,
          pisCofinsPercent: dto.pisCofinsPercent,
          operationMaintenancePercent: dto.operationMaintenancePercent,
          incomeTaxPercent: dto.incomeTaxPercent,
        },
        resolveAuthor(user),
      );
    } catch (error) {
      handleViabilityError(error);
    }
  }

  @Put('parameters')
  updateParameters(): never {
    throw versionImmutableException();
  }

  @Patch('parameters')
  patchParameters(): never {
    throw versionImmutableException();
  }

  @Get('assessment')
  async assessment(
    @Query() query: ViabilityAssessmentQueryDto,
  ): Promise<ViabilityAssessmentResponse> {
    try {
      return await this.getAssessment.execute(
        Number(query.offerId),
        Number(query.revisionId),
      );
    } catch (error) {
      handleViabilityError(error);
    }
  }
}
