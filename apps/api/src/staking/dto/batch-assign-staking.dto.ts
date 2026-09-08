import { AccessDifficulty } from '@lt-offers/domain';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class BatchAssignStakingDto {
  @IsOptional()
  @IsArray({ message: 'towerIds deve ser uma lista de IDs.' })
  @IsNumber({}, { each: true, message: 'Cada item de towerIds deve ser numérico.' })
  towerIds?: number[];

  @IsOptional()
  @IsNumber({}, { message: 'Estaca inicial deve ser numérica.' })
  @Min(0, { message: 'Estaca inicial não pode ser negativa.' })
  startStationMeters?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Estaca final deve ser numérica.' })
  @Min(0, { message: 'Estaca final não pode ser negativa.' })
  endStationMeters?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Filtro de tipo de torre deve ser numérico.' })
  towerTypeIdFilter?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Filtro de tipo de solo deve ser numérico.' })
  soilTypeIdFilter?: number;

  @IsOptional()
  @IsNumber({}, { message: 'ID do tipo de torre a atribuir deve ser numérico.' })
  assignTowerTypeId?: number | null;

  @IsOptional()
  @IsNumber({}, { message: 'ID do tipo de solo a atribuir deve ser numérico.' })
  assignSoilTypeId?: number | null;

  @IsOptional()
  @IsNumber({}, { message: 'ID do tipo de fundação a atribuir deve ser numérico.' })
  assignFoundationTypeId?: number | null;

  @IsOptional()
  @IsEnum(['NORMAL', 'DIFFICULT', 'CROSSING'], {
    message:
      'Dificuldade de acesso inválida. Valores permitidos: NORMAL, DIFFICULT, CROSSING.',
  })
  assignAccessDifficulty?: AccessDifficulty;

  @IsOptional()
  @IsString({ message: 'Notas devem ser uma string.' })
  assignNotes?: string | null;
}
