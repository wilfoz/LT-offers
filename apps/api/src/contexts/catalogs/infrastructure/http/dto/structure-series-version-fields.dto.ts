import { POSITIVE_DECIMAL_PATTERN } from '@lt-offers/domain';
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { countMessage, decimalMessage } from './validation-messages';

/**
 * Campos versionáveis da série de estrutura. Valores decimais trafegam como
 * string (RNF-08); null significa "não informado", distinto de "0" (RNF-09).
 */
export class StructureSeriesVersionFieldsDto {
  @IsOptional()
  @IsString({ message: 'O projetista deve ser um texto' })
  @MaxLength(100, { message: 'O projetista deve ter no máximo 100 caracteres' })
  designer?: string | null;

  @IsOptional()
  @Matches(POSITIVE_DECIMAL_PATTERN, {
    message: decimalMessage('tensão (kV)'),
  })
  voltageKv?: string | null;

  @IsOptional()
  @IsInt({ message: countMessage('circuitos') })
  @Min(1, { message: countMessage('circuitos') })
  circuitCount?: number | null;

  @IsOptional()
  @IsInt({ message: countMessage('cabos por fase') })
  @Min(1, { message: countMessage('cabos por fase') })
  cablesPerPhase?: number | null;

  @IsOptional()
  @Matches(POSITIVE_DECIMAL_PATTERN, {
    message: decimalMessage('vento de projeto (m/s)'),
  })
  designWindSpeedMs?: string | null;

  @IsOptional()
  @IsString({ message: 'O tipo de isolador deve ser um texto' })
  @MaxLength(100, {
    message: 'O tipo de isolador deve ter no máximo 100 caracteres',
  })
  insulatorType?: string | null;

  @IsOptional()
  @Matches(POSITIVE_DECIMAL_PATTERN, {
    message: decimalMessage('SIL (MW)'),
  })
  silMw?: string | null;
}
