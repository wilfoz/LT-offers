import {
  DATE_PATTERN,
  FIXED_COST_CATEGORIES,
  FixedCostCategory,
} from '@lt-offers/domain';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { FixedCostVersionFieldsDto } from './fixed-cost-version-fields.dto';

export class CreateFixedCostDto extends FixedCostVersionFieldsDto {
  @IsString({ message: 'O código deve ser um texto' })
  @IsNotEmpty({ message: 'O código é obrigatório' })
  @MaxLength(50, { message: 'O código deve ter no máximo 50 caracteres' })
  code!: string;

  @IsString({ message: 'A descrição deve ser um texto' })
  @IsNotEmpty({ message: 'A descrição é obrigatória' })
  @MaxLength(200, { message: 'A descrição deve ter no máximo 200 caracteres' })
  description!: string;

  @IsIn(FIXED_COST_CATEGORIES, {
    message: 'A categoria deve ser uma das opções válidas',
  })
  category!: FixedCostCategory;

  @IsOptional()
  @Matches(DATE_PATTERN, {
    message: 'A data de início de vigência deve estar no formato AAAA-MM-DD',
  })
  effectiveFrom?: string;
}
