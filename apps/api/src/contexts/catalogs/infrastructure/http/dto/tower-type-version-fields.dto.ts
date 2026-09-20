import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  Min,
  Validate,
  ValidateNested,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { TowerWeightPointDto } from './tower-weight-point.dto';
import { nonNegativeCountMessage } from './validation-messages';

// Alturas duplicadas são rejeitadas já no DTO (mensagem pt-BR); o
// @@unique([towerTypeVersionId, heightM]) do banco fica como cinturão.
// Comparação numérica: "24" e "24.000" são a mesma altura.
@ValidatorConstraint({ name: 'uniqueWeightHeights' })
export class UniqueWeightHeights implements ValidatorConstraintInterface {
  validate(weights: unknown): boolean {
    if (!Array.isArray(weights)) {
      return true;
    }
    const heights = weights
      .map((point) =>
        point && typeof point === 'object'
          ? Number((point as { heightM?: unknown }).heightM)
          : NaN,
      )
      .filter((height) => Number.isFinite(height));
    return new Set(heights).size === heights.length;
  }
}

/**
 * Campos versionáveis do tipo de torre. Zero estais é valor válido de torre
 * autoportante, distinto de null = "não informado" (RNF-09). A tabela peso ×
 * altura pertence à versão; array ausente = tabela vazia (pendência, não erro).
 */
export class TowerTypeVersionFieldsDto {
  @IsOptional()
  @IsInt({ message: nonNegativeCountMessage('quantidade de estais') })
  @Min(0, { message: nonNegativeCountMessage('quantidade de estais') })
  guyCount?: number | null;

  @IsOptional()
  @IsArray({ message: 'A tabela peso × altura deve ser uma lista de pontos' })
  @ValidateNested({ each: true })
  @Type(() => TowerWeightPointDto)
  @Validate(UniqueWeightHeights, {
    message: 'Há alturas duplicadas na tabela peso × altura',
  })
  weights?: TowerWeightPointDto[];
}
