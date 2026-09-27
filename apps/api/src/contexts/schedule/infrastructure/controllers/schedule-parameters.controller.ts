import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Headers,
  NotFoundException,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CivilDate } from '../../../catalogs/domain/value-objects/civil-date.vo';
import {
  handleCatalogDomainError,
  resolveAuthor,
  resolveReferenceDate,
  versionImmutableException,
} from '../../../catalogs/infrastructure/http/controller-shared';
import {
  DuplicateScheduleParametersDateException,
  InvalidScheduleParametersException,
  NoEffectiveScheduleParametersException,
} from '../../domain';
import {
  CreateRainfallParametersVersionUseCase,
  CreateWorkCalendarVersionUseCase,
  GetEffectiveRainfallParametersUseCase,
  GetEffectiveWorkCalendarUseCase,
} from '../../application/usecases';
import { CreateRainfallParametersVersionDto } from '../dto/create-rainfall-parameters-version.dto';
import { CreateWorkCalendarVersionDto } from '../dto/create-work-calendar-version.dto';

/** Mapeia exceções de domínio dos parâmetros para respostas HTTP (pt-BR). */
export function handleScheduleParametersError(error: unknown): never {
  if (error instanceof NoEffectiveScheduleParametersException) {
    throw new NotFoundException(error.message);
  }
  if (error instanceof DuplicateScheduleParametersDateException) {
    throw new ConflictException(error.message);
  }
  if (error instanceof InvalidScheduleParametersException) {
    throw new BadRequestException(error.messages);
  }
  handleCatalogDomainError(error);
}

/**
 * Catálogos singleton de configuração do cronograma (RN-16, RNF-05):
 * parâmetros de chuva e calendário de trabalho. GET resolve a versão vigente
 * pela data de referência (borda, design D2); POST cria uma nova versão;
 * versões são imutáveis (PUT/PATCH respondem 405).
 */
@Controller('schedule-parameters')
export class ScheduleParametersController {
  constructor(
    private readonly getEffectiveRainfall: GetEffectiveRainfallParametersUseCase,
    private readonly createRainfall: CreateRainfallParametersVersionUseCase,
    private readonly getEffectiveWorkCalendar: GetEffectiveWorkCalendarUseCase,
    private readonly createWorkCalendar: CreateWorkCalendarVersionUseCase,
  ) {}

  @Get('rainfall')
  async getRainfall(@Query('effectiveOn') effectiveOn?: string) {
    try {
      const refDate = resolveReferenceDate(effectiveOn);
      return await this.getEffectiveRainfall.execute(refDate.toIsoDateString());
    } catch (error) {
      handleScheduleParametersError(error);
    }
  }

  @Post('rainfall')
  async createRainfallVersion(
    @Body() dto: CreateRainfallParametersVersionDto,
    @Headers('x-user') user?: string,
  ) {
    try {
      // Round-trip de calendário na borda: rejeita 2027-02-30 sem rollover.
      const effectiveFrom = CivilDate.fromString(dto.effectiveFrom);
      return await this.createRainfall.execute({
        effectiveFrom: effectiveFrom.toIsoDateString(),
        createdBy: resolveAuthor(user),
        parameters: { bands: dto.bands, ufSeries: dto.ufSeries },
      });
    } catch (error) {
      handleScheduleParametersError(error);
    }
  }

  @Put('rainfall')
  updateRainfall(): never {
    throw versionImmutableException();
  }

  @Patch('rainfall')
  patchRainfall(): never {
    throw versionImmutableException();
  }

  @Get('work-calendar')
  async getWorkCalendar(@Query('effectiveOn') effectiveOn?: string) {
    try {
      const refDate = resolveReferenceDate(effectiveOn);
      return await this.getEffectiveWorkCalendar.execute(
        refDate.toIsoDateString(),
      );
    } catch (error) {
      handleScheduleParametersError(error);
    }
  }

  @Post('work-calendar')
  async createWorkCalendarVersion(
    @Body() dto: CreateWorkCalendarVersionDto,
    @Headers('x-user') user?: string,
  ) {
    try {
      const effectiveFrom = CivilDate.fromString(dto.effectiveFrom);
      return await this.createWorkCalendar.execute({
        effectiveFrom: effectiveFrom.toIsoDateString(),
        createdBy: resolveAuthor(user),
        calendar: {
          standardWorkingDaysPerMonth: dto.standardWorkingDaysPerMonth,
          nonWorkingWeekdays: dto.nonWorkingWeekdays,
          holidays: dto.holidays,
        },
      });
    } catch (error) {
      handleScheduleParametersError(error);
    }
  }

  @Put('work-calendar')
  updateWorkCalendar(): never {
    throw versionImmutableException();
  }

  @Patch('work-calendar')
  patchWorkCalendar(): never {
    throw versionImmutableException();
  }
}
