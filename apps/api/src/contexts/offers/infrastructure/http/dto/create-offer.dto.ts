import {
  AUCTION_NUMBER_PATTERN,
  DATE_PATTERN,
  POSITIVE_DECIMAL_PATTERN,
} from '@lt-offers/domain';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  Validate,
  ValidateNested,
} from 'class-validator';
import { DecimalWithScale } from '../../../../catalogs/infrastructure/http/dto/decimal-scale.validators';
import { IsCivilDate } from './civil-date.validator';
import { ScopeMatrixItemDto } from './scope-matrix-item.dto';
import { TransmissionLineItemDto } from './transmission-line-item.dto';

export class CreateOfferDto {
  @IsString({ message: 'O código da oferta deve ser um texto' })
  @IsNotEmpty({ message: 'O código da oferta é obrigatório' })
  @MaxLength(30, {
    message: 'O código da oferta deve ter no máximo 30 caracteres',
  })
  code!: string;

  @IsString({ message: 'O nome da oferta deve ser um texto' })
  @IsNotEmpty({ message: 'O nome da oferta é obrigatório' })
  @MaxLength(200, {
    message: 'O nome da oferta deve ter no máximo 200 caracteres',
  })
  name!: string;

  @IsString({ message: 'O nome do cliente deve ser um texto' })
  @IsNotEmpty({ message: 'O nome do cliente é obrigatório' })
  @MaxLength(150, {
    message: 'O nome do cliente deve ter no máximo 150 caracteres',
  })
  clientName!: string;

  @IsOptional()
  @IsString({ message: 'A moeda base deve ser um texto' })
  @MaxLength(10, { message: 'A moeda base deve ter no máximo 10 caracteres' })
  baseCurrency?: string;

  @IsString({ message: 'O nome do leilão deve ser um texto' })
  @IsNotEmpty({ message: 'O nome do leilão é obrigatório' })
  @MaxLength(100, {
    message: 'O nome do leilão deve ter no máximo 100 caracteres',
  })
  auctionName!: string;

  @IsString({ message: 'O nome do lote deve ser um texto' })
  @IsNotEmpty({ message: 'O nome do lote é obrigatório' })
  @MaxLength(100, {
    message: 'O nome do lote deve ter no máximo 100 caracteres',
  })
  lotName!: string;

  @IsOptional()
  @Matches(AUCTION_NUMBER_PATTERN, {
    message:
      'O número do leilão deve estar no formato NNN/AAAA (ex.: 004/2026)',
  })
  auctionNumber?: string | null;

  @IsOptional()
  @IsInt({ message: 'O número do lote deve ser um número inteiro' })
  @Min(1, { message: 'O número do lote deve ser maior ou igual a 1' })
  lotNumber?: number | null;

  @IsOptional()
  @IsString({ message: 'O sublote deve ser um texto' })
  @MaxLength(3, { message: 'O sublote deve ter no máximo 3 caracteres' })
  subLotCode?: string | null;

  @IsString({ message: 'A data da oferta é obrigatória' })
  @Matches(DATE_PATTERN, {
    message: 'A data da oferta deve estar no formato AAAA-MM-DD',
  })
  offerDate!: string;

  @IsOptional()
  @Matches(DATE_PATTERN, {
    message: 'A data do leilão deve estar no formato AAAA-MM-DD',
  })
  auctionDate?: string | null;

  @IsOptional()
  @Matches(DATE_PATTERN, {
    message: 'A data de início do cronograma deve estar no formato AAAA-MM-DD',
  })
  scheduleStartDate?: string | null;

  @IsOptional()
  @Matches(DATE_PATTERN, {
    message: 'A data de entrada em operação deve estar no formato AAAA-MM-DD',
  })
  commercialOperationDate?: string | null;

  @IsOptional()
  @IsCivilDate({
    message:
      'A data de assinatura do contrato deve ser uma data de calendário válida no formato AAAA-MM-DD',
  })
  contractSigningDate?: string | null;

  @IsOptional()
  @IsInt({
    message: 'O prazo de construção deve ser um número inteiro de meses',
  })
  @Min(1, { message: 'O prazo de construção deve ser maior que zero' })
  @Max(240, {
    message: 'O prazo de construção deve ser de no máximo 240 meses',
  })
  constructionDeadlineMonths?: number | null;

  @IsOptional()
  @Matches(POSITIVE_DECIMAL_PATTERN, {
    message: 'O CAPEX estimado deve ser um número decimal não negativo',
  })
  estimatedCapex?: string | null;

  @IsOptional()
  @Matches(POSITIVE_DECIMAL_PATTERN, {
    message: 'A RAP máxima deve ser um número decimal não negativo',
  })
  maxRap?: string | null;

  @IsOptional()
  @Matches(POSITIVE_DECIMAL_PATTERN, {
    message: 'A RAP vencedora deve ser um número decimal não negativo',
  })
  winningRap?: string | null;

  @IsOptional()
  @Validate(DecimalWithScale, [2], {
    message:
      'O investimento do licitante deve ser um número decimal não negativo com até 2 casas',
  })
  bidderCapex?: string | null;

  @IsOptional()
  @IsString({ message: 'As notas devem ser texto' })
  notes?: string | null;

  @IsOptional()
  @IsArray({ message: 'As linhas de transmissão devem ser uma lista' })
  @ValidateNested({ each: true })
  @Type(() => TransmissionLineItemDto)
  transmissionLines?: TransmissionLineItemDto[];

  @IsOptional()
  @IsArray({ message: 'A matriz de escopo deve ser uma lista' })
  @ValidateNested({ each: true })
  @Type(() => ScopeMatrixItemDto)
  scopeMatrixItems?: ScopeMatrixItemDto[];

  @IsOptional()
  @IsString({ message: 'O autor deve ser um texto' })
  @MaxLength(100, { message: 'O autor deve ter no máximo 100 caracteres' })
  createdBy?: string;
}
