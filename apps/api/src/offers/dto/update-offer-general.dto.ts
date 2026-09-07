import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateOfferGeneralDto {
  @IsOptional()
  @IsString({ message: 'O nome da oferta deve ser um texto' })
  @MaxLength(200, {
    message: 'O nome da oferta deve ter no máximo 200 caracteres',
  })
  name?: string;

  @IsOptional()
  @IsString({ message: 'O nome do cliente deve ser um texto' })
  @MaxLength(150, {
    message: 'O nome do cliente deve ter no máximo 150 caracteres',
  })
  clientName?: string;

  @IsOptional()
  @IsString({ message: 'A moeda base deve ser um texto' })
  @MaxLength(10, { message: 'A moeda base deve ter no máximo 10 caracteres' })
  baseCurrency?: string;
}
