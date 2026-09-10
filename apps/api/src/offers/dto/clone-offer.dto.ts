import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

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
  @IsString({ message: 'O autor deve ser um texto' })
  @MaxLength(100, { message: 'O autor deve ter no máximo 100 caracteres' })
  createdBy?: string;
}
