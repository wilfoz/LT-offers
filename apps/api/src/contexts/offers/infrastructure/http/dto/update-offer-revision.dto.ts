import {
  AUCTION_NUMBER_PATTERN,
  DATE_PATTERN,
  OFFER_REVISION_STATUSES,
  OfferRevisionStatus,
  POSITIVE_DECIMAL_PATTERN,
} from '@lt-offers/domain';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { IsCivilDate } from './civil-date.validator';
import { ScopeMatrixItemDto } from './scope-matrix-item.dto';
import { TransmissionLineItemDto } from './transmission-line-item.dto';

export class UpdateOfferRevisionDto {
  @IsOptional()
  @IsString({ message: 'O nome do leilão deve ser um texto' })
  @MaxLength(100, {
    message: 'O nome do leilão deve ter no máximo 100 caracteres',
  })
  auctionName?: string;

  @IsOptional()
  @IsString({ message: 'O nome do lote deve ser um texto' })
  @MaxLength(100, {
    message: 'O nome do lote deve ter no máximo 100 caracteres',
  })
  lotName?: string;

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

  @IsOptional()
  @Matches(DATE_PATTERN, {
    message: 'A data da oferta deve estar no formato AAAA-MM-DD',
  })
  offerDate?: string;

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
  @IsString({ message: 'As notas devem ser texto' })
  notes?: string | null;

  @IsOptional()
  @IsIn(OFFER_REVISION_STATUSES, {
    message:
      'O status da revisão deve ser DRAFT, FROZEN, DELIVERED, WON ou IN_EXECUTION',
  })
  status?: OfferRevisionStatus;

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
}
