import { DATE_PATTERN } from '@lt-offers/domain';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Max,
  Min,
  Validate,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { PositiveNonZeroDecimal } from '../../../catalogs/infrastructure/http/dto/decimal-scale.validators';
import { decimalWithScaleMessage } from '../../../catalogs/infrastructure/http/dto/validation-messages';

/** Feriado; a validação de calendário round-trip é da domain (RNF-05). */
export class HolidayDto {
  @Matches(DATE_PATTERN, {
    message: 'A data do feriado deve estar no formato AAAA-MM-DD',
  })
  date!: string;

  @IsString({ message: 'O nome do feriado deve ser um texto' })
  @IsNotEmpty({ message: 'O nome do feriado é obrigatório' })
  name!: string;

  @IsBoolean({
    message: 'O indicador de recorrência deve ser verdadeiro ou falso',
  })
  recurring!: boolean;

  @ValidateIf((holiday) => holiday.uf !== null)
  @Matches(/^[A-Z]{2}$/, {
    message: 'A UF do feriado deve ter duas letras maiúsculas (ex.: BA)',
  })
  uf!: string | null;
}

export class CreateWorkCalendarVersionDto {
  @Matches(DATE_PATTERN, {
    message: 'A data de início de vigência deve estar no formato AAAA-MM-DD',
  })
  effectiveFrom!: string;

  // Escala 2 = Decimal(4,2) de standard_working_days_per_month no schema
  @Validate(PositiveNonZeroDecimal, [2], {
    message: decimalWithScaleMessage('dias úteis padrão por mês', 2),
  })
  standardWorkingDaysPerMonth!: string;

  @IsArray({
    message: 'Os dias não laborais devem ser uma lista de dias da semana',
  })
  @IsInt({
    each: true,
    message:
      'Cada dia não laboral deve ser um inteiro de 0 (domingo) a 6 (sábado)',
  })
  @Min(0, {
    each: true,
    message:
      'Cada dia não laboral deve ser um inteiro de 0 (domingo) a 6 (sábado)',
  })
  @Max(6, {
    each: true,
    message:
      'Cada dia não laboral deve ser um inteiro de 0 (domingo) a 6 (sábado)',
  })
  nonWorkingWeekdays!: number[];

  @IsArray({ message: 'Os feriados devem ser uma lista' })
  @ValidateNested({ each: true })
  @Type(() => HolidayDto)
  holidays!: HolidayDto[];
}
