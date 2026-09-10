import {
  DATE_PATTERN,
  FOUNDATION_APPLICATIONS,
  FoundationApplication,
} from '@lt-offers/domain';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { FoundationTypeVersionFieldsDto } from './foundation-type-version-fields.dto';

export class CreateFoundationTypeDto extends FoundationTypeVersionFieldsDto {
  @IsString({ message: 'A sigla deve ser um texto' })
  @IsNotEmpty({ message: 'A sigla é obrigatória' })
  @MaxLength(50, { message: 'A sigla deve ter no máximo 50 caracteres' })
  code!: string;

  @IsIn(FOUNDATION_APPLICATIONS, {
    message:
      'A aplicação deve ser SELF_SUPPORTING (autoportante), GUYED (estaiada) ou CROSS_ROPE',
  })
  application!: FoundationApplication;

  @IsOptional()
  @Matches(DATE_PATTERN, {
    message: 'A data de início de vigência deve estar no formato AAAA-MM-DD',
  })
  effectiveFrom?: string;
}
