import { DATE_PATTERN } from '@lt-offers/domain';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { WorkCrewVersionFieldsDto } from './work-crew-version-fields.dto';

export class CreateWorkCrewDto extends WorkCrewVersionFieldsDto {
  @IsString({ message: 'O código deve ser um texto' })
  @IsNotEmpty({ message: 'O código é obrigatório' })
  @MaxLength(30, { message: 'O código deve ter no máximo 30 caracteres' })
  code!: string;

  @IsString({ message: 'O nome da equipe deve ser um texto' })
  @IsNotEmpty({ message: 'O nome da equipe é obrigatório' })
  @MaxLength(100, {
    message: 'O nome da equipe deve ter no máximo 100 caracteres',
  })
  name!: string;

  @IsOptional()
  @Matches(DATE_PATTERN, {
    message: 'A data de início de vigência deve estar no formato AAAA-MM-DD',
  })
  effectiveFrom?: string;
}
