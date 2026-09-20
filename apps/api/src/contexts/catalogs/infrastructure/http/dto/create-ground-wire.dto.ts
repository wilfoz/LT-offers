import {
  DATE_PATTERN,
  GROUND_WIRE_TYPES,
  GroundWireType,
} from '@lt-offers/domain';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { GroundWireVersionFieldsDto } from './ground-wire-version-fields.dto';

export class CreateGroundWireDto extends GroundWireVersionFieldsDto {
  @IsString({ message: 'O código deve ser um texto' })
  @IsNotEmpty({ message: 'O código é obrigatório' })
  @MaxLength(50, { message: 'O código deve ter no máximo 50 caracteres' })
  code!: string;

  @IsIn(GROUND_WIRE_TYPES, {
    message: 'O tipo deve ser STEEL (aço) ou OPGW',
  })
  type!: GroundWireType;

  @IsOptional()
  @Matches(DATE_PATTERN, {
    message: 'A data de início de vigência deve estar no formato AAAA-MM-DD',
  })
  effectiveFrom?: string;
}
