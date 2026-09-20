import { DATE_PATTERN } from '@lt-offers/domain';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { EquipmentVersionFieldsDto } from './equipment-version-fields.dto';

export class CreateEquipmentDto extends EquipmentVersionFieldsDto {
  @IsString({ message: 'O código deve ser um texto' })
  @IsNotEmpty({ message: 'O código é obrigatório' })
  @MaxLength(50, { message: 'O código deve ter no máximo 50 caracteres' })
  code!: string;

  @IsString({ message: 'A descrição deve ser um texto' })
  @IsNotEmpty({ message: 'A descrição é obrigatória' })
  @MaxLength(200, { message: 'A descrição deve ter no máximo 200 caracteres' })
  description!: string;

  @IsOptional()
  @IsString({ message: 'A categoria deve ser um texto' })
  @MaxLength(100, { message: 'A categoria deve ter no máximo 100 caracteres' })
  category?: string | null;

  @IsOptional()
  @Matches(DATE_PATTERN, {
    message: 'A data de início de vigência deve estar no formato AAAA-MM-DD',
  })
  effectiveFrom?: string;
}
