import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class PlsCaddCommitRowDto {
  @IsString()
  @IsNotEmpty()
  towerNumber!: string;

  @IsNumber()
  @Min(0)
  stationMeters!: number;

  @IsNumber()
  bodyExtensionMeters!: number;

  @IsNumber()
  @Min(0)
  deflectionAngleDeg!: number;

  @IsNumber()
  lateralOffsetMeters!: number;

  @IsOptional()
  @IsNumber()
  utmEast?: number | null;

  @IsOptional()
  @IsNumber()
  utmNorth?: number | null;

  @IsOptional()
  @IsNumber()
  elevationMeters?: number | null;

  @IsOptional()
  @IsString()
  towerTypeCode?: string | null;

  @IsOptional()
  @IsString()
  soilTypeCode?: string | null;

  @IsOptional()
  @IsString()
  foundationTypeCode?: string | null;
}

export class PlsCaddCommitDto {
  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlsCaddCommitRowDto)
  rows!: PlsCaddCommitRowDto[];

  @IsOptional()
  @IsBoolean()
  preserveExistingAssignments?: boolean = true;
}
