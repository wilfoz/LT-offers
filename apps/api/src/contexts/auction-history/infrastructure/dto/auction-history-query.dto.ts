import { AUCTION_NUMBER_PATTERN } from '@lt-offers/domain';
import { IsNotEmpty, IsOptional, Matches, MaxLength } from 'class-validator';

/** Filtros da consulta do snapshot (query params chegam como texto). */
export class ListAuctionResultsQueryDto {
  @IsOptional()
  @MaxLength(120, { message: 'A busca deve ter no máximo 120 caracteres' })
  search?: string;

  @IsOptional()
  @Matches(AUCTION_NUMBER_PATTERN, {
    message:
      'O número do leilão deve estar no formato NNN/AAAA (ex.: 002/2024)',
  })
  auctionNumber?: string;

  @IsOptional()
  @Matches(/^[A-Za-z]{2}$/, {
    message: 'A UF deve ser a sigla de duas letras (ex.: MG)',
  })
  uf?: string;

  @IsOptional()
  @Matches(/^\d{4}$/, {
    message: 'O ano do leilão deve ter quatro dígitos (ex.: 2024)',
  })
  year?: string;
}

/** Identidade normalizada do leilão para o benchmark (obrigatória). */
export class AuctionBenchmarkQueryDto {
  @IsNotEmpty({ message: 'O número do leilão é obrigatório' })
  @Matches(AUCTION_NUMBER_PATTERN, {
    message:
      'O número do leilão deve estar no formato NNN/AAAA (ex.: 002/2024)',
  })
  auctionNumber!: string;

  @IsNotEmpty({ message: 'O número do lote é obrigatório' })
  @Matches(/^[1-9]\d*$/, {
    message: 'O número do lote deve ser um número inteiro maior ou igual a 1',
  })
  lotNumber!: string;
}
