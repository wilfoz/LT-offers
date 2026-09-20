import {
  DATE_PATTERN,
  TOWER_FUNCTIONS,
  TowerFunction,
} from '@lt-offers/domain';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { TowerTypeVersionFieldsDto } from './tower-type-version-fields.dto';

export class CreateTowerTypeDto extends TowerTypeVersionFieldsDto {
  @IsString({ message: 'A sigla deve ser um texto' })
  @IsNotEmpty({ message: 'A sigla é obrigatória' })
  @MaxLength(30, { message: 'A sigla deve ter no máximo 30 caracteres' })
  code!: string;

  @IsIn(TOWER_FUNCTIONS, {
    message: 'A função deve ser SUSPENSION (suspensão) ou ANCHOR (ancoragem)',
  })
  function!: TowerFunction;

  @IsOptional()
  @Matches(DATE_PATTERN, {
    message: 'A data de início de vigência deve estar no formato AAAA-MM-DD',
  })
  effectiveFrom?: string;
}
