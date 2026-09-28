import { AUCTION_NUMBER_PATTERN } from '@lt-offers/domain';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CloneOfferDto {
  @IsString({ message: 'O código da nova oferta deve ser um texto' })
  @IsNotEmpty({ message: 'O código da nova oferta é obrigatório' })
  @MaxLength(30, {
    message: 'O código da nova oferta deve ter no máximo 30 caracteres',
  })
  targetCode!: string;

  @IsString({ message: 'O nome da nova oferta deve ser um texto' })
  @IsNotEmpty({ message: 'O nome da nova oferta é obrigatório' })
  @MaxLength(200, {
    message: 'O nome da nova oferta deve ter no máximo 200 caracteres',
  })
  targetName!: string;

  @IsOptional()
  @IsString({ message: 'O nome do leilão de destino deve ser um texto' })
  @MaxLength(100, {
    message: 'O nome do leilão de destino deve ter no máximo 100 caracteres',
  })
  targetAuctionName?: string;

  @IsOptional()
  @IsString({ message: 'O nome do lote de destino deve ser um texto' })
  @MaxLength(100, {
    message: 'O nome do lote de destino deve ter no máximo 100 caracteres',
  })
  targetLotName?: string;

  @IsOptional()
  @Matches(AUCTION_NUMBER_PATTERN, {
    message:
      'O número do leilão de destino deve estar no formato NNN/AAAA (ex.: 004/2026)',
  })
  targetAuctionNumber?: string | null;

  @IsOptional()
  @IsInt({ message: 'O número do lote de destino deve ser um número inteiro' })
  @Min(1, {
    message: 'O número do lote de destino deve ser maior ou igual a 1',
  })
  targetLotNumber?: number | null;

  @IsOptional()
  @IsString({ message: 'O sublote de destino deve ser um texto' })
  @MaxLength(3, {
    message: 'O sublote de destino deve ter no máximo 3 caracteres',
  })
  targetSubLotCode?: string | null;

  @IsOptional()
  @IsString({ message: 'O autor deve ser um texto' })
  @MaxLength(100, { message: 'O autor deve ter no máximo 100 caracteres' })
  createdBy?: string;
}
