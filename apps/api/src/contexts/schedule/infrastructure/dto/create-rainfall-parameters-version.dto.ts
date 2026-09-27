import { DATE_PATTERN } from '@lt-offers/domain';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsString,
  Matches,
  Min,
  Validate,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { DecimalWithScale } from '../../../catalogs/infrastructure/http/dto/decimal-scale.validators';
import { decimalWithScaleMessage } from '../../../catalogs/infrastructure/http/dto/validation-messages';

// Escalas travadas na precisão das colunas (Decimal(6,1) e Decimal(5,4)):
// sem o limite, um limite de faixa "49.95" seria arredondado em silêncio
// pelo Postgres para "50.0", mudando a fronteira histórica da classificação.

/** Faixa de severidade; upperLimitMm nulo apenas na última faixa (aberta). */
export class RainfallSeverityBandDto {
  @IsInt({ message: 'A posição da faixa deve ser um número inteiro' })
  @Min(1, { message: 'A posição da faixa deve ser maior ou igual a 1' })
  position!: number;

  // Escala 1 = Decimal(6,1) de upper_limit_mm no schema
  @ValidateIf((band) => band.upperLimitMm !== null)
  @Validate(DecimalWithScale, [1], {
    message: decimalWithScaleMessage('limite superior (mm)', 1),
  })
  upperLimitMm!: string | null;

  // Escala 4 = Decimal(5,4) de productivity_factor no schema; o intervalo
  // 0..1 é validado pela domain (violação band-factor-out-of-range).
  @Validate(DecimalWithScale, [4], {
    message: decimalWithScaleMessage('fator de produtividade', 4),
  })
  productivityFactor!: string;
}

/** Série de precipitação de uma UF (12 meses, índice 0 = janeiro). */
export class RainfallUfSeriesDto {
  @IsString({ message: 'A UF deve ser um texto de duas letras' })
  uf!: string;

  // Escala 1 = Decimal(6,1) das colunas jan_mm..dec_mm no schema
  @IsArray({ message: 'A série mensal deve ser uma lista de 12 valores' })
  @Validate(DecimalWithScale, [1], {
    each: true,
    message: decimalWithScaleMessage('precipitação mensal (mm)', 1),
  })
  monthlyMm!: string[];
}

export class CreateRainfallParametersVersionDto {
  @Matches(DATE_PATTERN, {
    message: 'A data de início de vigência deve estar no formato AAAA-MM-DD',
  })
  effectiveFrom!: string;

  @IsArray({ message: 'As faixas de severidade devem ser uma lista' })
  @ValidateNested({ each: true })
  @Type(() => RainfallSeverityBandDto)
  bands!: RainfallSeverityBandDto[];

  @IsArray({ message: 'A matriz de precipitação deve ser uma lista de UFs' })
  @ValidateNested({ each: true })
  @Type(() => RainfallUfSeriesDto)
  ufSeries!: RainfallUfSeriesDto[];
}
