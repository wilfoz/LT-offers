import { POSITIVE_DECIMAL_PATTERN } from '@lt-offers/domain';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class TransmissionLineItemDto {
  @IsOptional()
  @IsInt({ message: 'O identificador da linha deve ser um número inteiro' })
  id?: number;

  @IsString({ message: 'O código da linha deve ser um texto' })
  @IsNotEmpty({ message: 'O código da linha é obrigatório' })
  @MaxLength(50, {
    message: 'O código da linha deve ter no máximo 50 caracteres',
  })
  code!: string;

  @IsString({ message: 'O nome da linha deve ser um texto' })
  @IsNotEmpty({ message: 'O nome da linha é obrigatório' })
  @MaxLength(200, {
    message: 'O nome da linha deve ter no máximo 200 caracteres',
  })
  name!: string;

  @IsString({
    message: 'A tensão nominal deve ser uma representação textual decimal',
  })
  @Matches(POSITIVE_DECIMAL_PATTERN, {
    message: 'A tensão nominal (kV) deve ser um número decimal não negativo',
  })
  nominalVoltageKv!: string;

  @IsString({
    message: 'A extensão refinada deve ser uma representação textual decimal',
  })
  @Matches(POSITIVE_DECIMAL_PATTERN, {
    message: 'A extensão refinada (km) deve ser um número decimal não negativo',
  })
  refinedLengthKm!: string;

  @IsString({
    message:
      'A extensão de relatório deve ser uma representação textual decimal',
  })
  @Matches(POSITIVE_DECIMAL_PATTERN, {
    message:
      'A extensão de relatório (km) deve ser um número decimal não negativo',
  })
  reportLengthKm!: string;

  @IsInt({ message: 'A quantidade de circuitos deve ser um número inteiro' })
  @Min(1, { message: 'A linha deve ter no mínimo 1 circuito' })
  circuitCount!: number;

  @IsInt({
    message: 'A quantidade de condutores por fase deve ser um número inteiro',
  })
  @Min(1, { message: 'A linha deve ter no mínimo 1 condutor por fase' })
  bundleConductorCount!: number;

  @IsString({ message: 'A UF de destino primária deve ser um texto' })
  @IsNotEmpty({ message: 'A UF de destino primária é obrigatória' })
  @MaxLength(2, { message: 'A UF primária deve ter 2 caracteres' })
  destinationStatePrimary!: string;

  @IsString({
    message: 'O percentual de rateio da UF primária deve ser decimal',
  })
  @Matches(POSITIVE_DECIMAL_PATTERN, {
    message:
      'O percentual de rateio primário deve ser um número decimal não negativo',
  })
  destinationPercentagePrimary!: string;

  @IsOptional()
  @IsString({ message: 'A UF de destino secundária deve ser um texto' })
  @MaxLength(2, { message: 'A UF secundária deve ter 2 caracteres' })
  destinationStateSecondary?: string | null;

  @IsOptional()
  @Matches(POSITIVE_DECIMAL_PATTERN, {
    message:
      'O percentual de rateio secundário deve ser um número decimal não negativo',
  })
  destinationPercentageSecondary?: string | null;
}
