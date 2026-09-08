import { AccessDifficulty } from '@lt-offers/domain';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class StakingQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  pageSize?: number = 50;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  towerTypeId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  soilTypeId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  foundationTypeId?: number;

  @IsOptional()
  @IsEnum(['NORMAL', 'DIFFICULT', 'CROSSING'])
  accessDifficulty?: AccessDifficulty;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minStationMeters?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxStationMeters?: number;

  @IsOptional()
  @IsEnum(['stationMeters', 'towerNumber'])
  sortBy?: 'stationMeters' | 'towerNumber' = 'stationMeters';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortDirection?: 'asc' | 'desc' = 'asc';
}
