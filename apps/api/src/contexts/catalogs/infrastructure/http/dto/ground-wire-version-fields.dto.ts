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
 * Campos versionáveis do cabo de guarda: comuns à família mais os
 * específicos de cada tipo — a aplicabilidade por tipo é validada no
 * service (campo do outro tipo é rejeitado). Valores decimais trafegam
 * como string (RNF-08); null significa "não informado", distinto de
 * "0" (RNF-09).
 */
export class GroundWireVersionFieldsDto {
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

  // Específicos do tipo aço (DB_CGA)
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

  // Específicos do tipo OPGW (DB_OPGW)
  @IsOptional()
  @IsString({ message: 'O fabricante deve ser um texto' })
  @MaxLength(100, {
    message: 'O fabricante deve ter no máximo 100 caracteres',
  })
  manufacturer?: string | null;

  @IsOptional()
  @Matches(POSITIVE_DECIMAL_PATTERN, {
    message: decimalMessage('I²t (kA²·s)'),
  })
  i2tKa2s?: string | null;

  @IsOptional()
  @IsInt({ message: countMessage('número de fibras') })
  @Min(1, { message: countMessage('número de fibras') })
  fiberCount?: number | null;
}
