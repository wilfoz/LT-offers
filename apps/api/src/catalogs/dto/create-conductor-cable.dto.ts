import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { DATE_PATTERN, VersionFieldsDto } from './version-fields.dto';

export class CreateConductorCableDto extends VersionFieldsDto {
  @IsString({ message: 'O código deve ser um texto' })
  @IsNotEmpty({ message: 'O código é obrigatório' })
  @MaxLength(50, { message: 'O código deve ter no máximo 50 caracteres' })
  code!: string;

  @IsOptional()
  @Matches(DATE_PATTERN, {
    message: 'A data de início de vigência deve estar no formato AAAA-MM-DD',
  })
  effectiveFrom?: string;
}
