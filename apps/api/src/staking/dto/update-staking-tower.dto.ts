import { AccessDifficulty } from '@lt-offers/domain';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateStakingTowerDto {
  @IsOptional()
  @IsString({ message: 'Identificador da torre deve ser uma string.' })
  towerNumber?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Estaca em metros deve ser numérica.' })
  @Min(0, { message: 'Estaca não pode ser negativa.' })
  stationMeters?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Extensão de pé deve ser numérica.' })
  bodyExtensionMeters?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Ângulo de deflexão deve ser numérico.' })
  @Min(0, { message: 'Ângulo de deflexão não pode ser negativo.' })
  deflectionAngleDeg?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Offset lateral deve ser numérico.' })
  lateralOffsetMeters?: number;

  @IsOptional()
  @IsNumber({}, { message: 'UTM Leste deve ser numérico.' })
  utmEast?: number;

  @IsOptional()
  @IsNumber({}, { message: 'UTM Norte deve ser numérico.' })
  utmNorth?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Cota de terreno deve ser numérica.' })
  elevationMeters?: number;

  @IsOptional()
  @IsNumber({}, { message: 'ID do tipo de torre deve ser um número.' })
  towerTypeId?: number | null;

  @IsOptional()
  @IsNumber({}, { message: 'ID do tipo de solo deve ser um número.' })
  soilTypeId?: number | null;

  @IsOptional()
  @IsNumber({}, { message: 'ID do tipo de fundação deve ser um número.' })
  foundationTypeId?: number | null;

  @IsOptional()
  @IsEnum(['NORMAL', 'DIFFICULT', 'CROSSING'], {
    message:
      'Dificuldade de acesso inválida. Valores permitidos: NORMAL, DIFFICULT, CROSSING.',
  })
  accessDifficulty?: AccessDifficulty;

  @IsOptional()
  @IsString({ message: 'Notas devem ser uma string.' })
  notes?: string | null;
}
