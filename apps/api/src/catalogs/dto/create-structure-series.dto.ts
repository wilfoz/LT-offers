import { DATE_PATTERN } from '@lt-offers/domain';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { StructureSeriesVersionFieldsDto } from './structure-series-version-fields.dto';

export class CreateStructureSeriesDto extends StructureSeriesVersionFieldsDto {
  @IsString({ message: 'O nome deve ser um texto' })
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  @MaxLength(100, { message: 'O nome deve ter no máximo 100 caracteres' })
  name!: string;

  @IsOptional()
  @Matches(DATE_PATTERN, {
    message: 'A data de início de vigência deve estar no formato AAAA-MM-DD',
  })
  effectiveFrom?: string;
}
