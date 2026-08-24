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
 * Campos versionáveis do cabo de tirante. Valores decimais trafegam como
 * string (RNF-08); null significa "não informado", distinto de "0" (RNF-09).
 */
export class GuyWireVersionFieldsDto {
  @IsOptional()
  @IsString({ message: 'A descrição deve ser um texto' })
  @MaxLength(200, { message: 'A descrição deve ter no máximo 200 caracteres' })
  description?: string | null;

  @IsOptional()
  @Matches(POSITIVE_DECIMAL_PATTERN, {
    message: decimalMessage('peso (ton/km)'),
  })
  weightTonPerKm?: string | null;

  @IsOptional()
  @Matches(POSITIVE_DECIMAL_PATTERN, {
    message: decimalMessage('bobina (m)'),
  })
  reelLengthM?: string | null;

  @IsOptional()
  @Matches(POSITIVE_DECIMAL_PATTERN, {
    message: decimalMessage('diâmetro (mm)'),
  })
  diameterMm?: string | null;

  @IsOptional()
  @Matches(POSITIVE_DECIMAL_PATTERN, {
    message: decimalMessage('UTS (kN)'),
  })
  utsKn?: string | null;

  @IsOptional()
  @IsString({ message: 'A classe de galvanização deve ser um texto' })
  @MaxLength(50, {
    message: 'A classe de galvanização deve ter no máximo 50 caracteres',
  })
  galvanizationClass?: string | null;

  @IsOptional()
  @IsString({ message: 'O grau de resistência deve ser um texto' })
  @MaxLength(50, {
    message: 'O grau de resistência deve ter no máximo 50 caracteres',
  })
  strengthGrade?: string | null;

  @IsOptional()
  @IsInt({ message: countMessage('número de fios') })
  @Min(1, { message: countMessage('número de fios') })
  wireCount?: number | null;
}
