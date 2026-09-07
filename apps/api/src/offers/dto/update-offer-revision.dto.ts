import {
  DATE_PATTERN,
  OFFER_REVISION_STATUSES,
  OfferRevisionStatus,
  POSITIVE_DECIMAL_PATTERN,
} from '@lt-offers/domain';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ScopeMatrixItemDto } from './scope-matrix-item.dto';
import { TransmissionLineItemDto } from './transmission-line-item.dto';

export class UpdateOfferRevisionDto {
  @IsOptional()
  @IsString({ message: 'O nome do leilão deve ser um texto' })
  @MaxLength(100, { message: 'O nome do leilão deve ter no máximo 100 caracteres' })
  auctionName?: string;

  @IsOptional()
  @IsString({ message: 'O nome do lote deve ser um texto' })
  @MaxLength(100, { message: 'O nome do lote deve ter no máximo 100 caracteres' })
  lotName?: string;

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
    message: 'O status da revisão deve ser DRAFT, FROZEN ou DELIVERED',
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
