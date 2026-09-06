import { IsInt, IsOptional, Min, Validate } from 'class-validator';
import { DecimalWithScale } from './decimal-scale.validators';
import { decimalWithScaleMessage } from './validation-messages';

/**
 * Campos versionáveis de equipamento (DB_EQ, RF-13, RN-17).
 * Valores monetários trafegam como string formatada (RNF-08);
 * anos e contagens são inteiros. null = não informado (RNF-09).
 */
export class EquipmentVersionFieldsDto {
  @IsOptional()
  @Validate(DecimalWithScale, [2], {
    message: decimalWithScaleMessage('locação externa (R$/mês)', 2),
  })
  externalRentalMonthly?: string | null;

  @IsOptional()
  @Validate(DecimalWithScale, [2], {
    message: decimalWithScaleMessage('locação interna (R$/mês)', 2),
  })
  internalRentalMonthly?: string | null;

  @IsOptional()
  @Validate(DecimalWithScale, [2], {
    message: decimalWithScaleMessage('preço de compra (R$)', 2),
  })
  purchasePrice?: string | null;

  @IsOptional()
  @IsInt({ message: 'Os anos de amortização devem ser um número inteiro' })
  @Min(1, { message: 'Os anos de amortização devem ser maiores que zero' })
  depreciationYears?: number | null;

  @IsOptional()
  @IsInt({ message: 'A disponibilidade própria deve ser um número inteiro' })
  @Min(0, {
    message: 'A disponibilidade própria deve ser maior ou igual a zero',
  })
  ownedAvailabilityCount?: number | null;

  @IsOptional()
  @Validate(DecimalWithScale, [2], {
    message: decimalWithScaleMessage('combustível e manutenção (R$/mês)', 2),
  })
  fuelMaintenanceMonthly?: string | null;
}
