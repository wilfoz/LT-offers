import { POSITIVE_DECIMAL_PATTERN } from '@lt-offers/domain';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { decimalMessage } from './validation-messages';

/**
 * Campos versionáveis do cabo condutor. Valores numéricos trafegam como
 * string decimal (RNF-08); null significa "não informado", distinto de
 * "0" (RNF-09).
 */
export class VersionFieldsDto {
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
}
