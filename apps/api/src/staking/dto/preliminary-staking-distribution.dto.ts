import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class PreliminaryPercentageDto {
  @IsNumber({}, { message: 'ID do item deve ser numérico.' })
  @IsNotEmpty({ message: 'ID do item é obrigatório.' })
  id!: number;

  @IsOptional()
  @IsString({ message: 'Código deve ser uma string.' })
  code?: string;

  @IsOptional()
  @IsString({ message: 'Nome deve ser uma string.' })
  name?: string;

  @IsString({ message: 'Percentual deve ser uma string formatada (ex: "50.00").' })
  @IsNotEmpty({ message: 'Percentual é obrigatório.' })
  percentage!: string;
}

export class SavePreliminaryStakingDistributionDto {
  @IsArray({ message: 'soilPercentages deve ser um array de distribuições.' })
  @ValidateNested({ each: true })
  @Type(() => PreliminaryPercentageDto)
  soilPercentages!: PreliminaryPercentageDto[];

  @IsArray({ message: 'foundationPercentages deve ser um array de distribuições.' })
  @ValidateNested({ each: true })
  @Type(() => PreliminaryPercentageDto)
  foundationPercentages!: PreliminaryPercentageDto[];
}
