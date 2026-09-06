import { DATE_PATTERN } from '@lt-offers/domain';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { LaborRoleVersionFieldsDto } from './labor-role-version-fields.dto';

export class CreateLaborRoleDto extends LaborRoleVersionFieldsDto {
  @IsString({ message: 'O código deve ser um texto' })
  @IsNotEmpty({ message: 'O código é obrigatório' })
  @MaxLength(50, { message: 'O código deve ter no máximo 50 caracteres' })
  code!: string;

  @IsString({ message: 'O nome do cargo deve ser um texto' })
  @IsNotEmpty({ message: 'O nome do cargo é obrigatório' })
  @MaxLength(100, {
    message: 'O nome do cargo deve ter no máximo 100 caracteres',
  })
  name!: string;

  @IsOptional()
  @Matches(DATE_PATTERN, {
    message: 'A data de início de vigência deve estar no formato AAAA-MM-DD',
  })
  effectiveFrom?: string;
}
