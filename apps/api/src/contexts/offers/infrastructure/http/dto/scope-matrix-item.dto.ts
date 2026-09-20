import {
  SCOPE_RESPONSIBLE_PARTIES,
  ScopeResponsibleParty,
} from '@lt-offers/domain';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class ScopeMatrixItemDto {
  @IsOptional()
  @IsInt({ message: 'O identificador do item deve ser um número inteiro' })
  id?: number;

  @IsString({ message: 'O código do item deve ser um texto' })
  @IsNotEmpty({ message: 'O código do item é obrigatório' })
  @MaxLength(50, {
    message: 'O código do item deve ter no máximo 50 caracteres',
  })
  itemCode!: string;

  @IsString({ message: 'A descrição do item deve ser um texto' })
  @IsNotEmpty({ message: 'A descrição do item é obrigatória' })
  @MaxLength(200, {
    message: 'A descrição do item deve ter no máximo 200 caracteres',
  })
  itemName!: string;

  @IsString({ message: 'A categoria do item deve ser um texto' })
  @IsNotEmpty({ message: 'A categoria do item é obrigatória' })
  @MaxLength(100, {
    message: 'A categoria do item deve ter no máximo 100 caracteres',
  })
  category!: string;

  @IsIn(SCOPE_RESPONSIBLE_PARTIES, {
    message: 'A responsabilidade deve ser CONTRACTOR ou CLIENT',
  })
  responsibleParty!: ScopeResponsibleParty;

  @IsBoolean({ message: 'O faturamento direto deve ser booleano' })
  acceptsDirectBilling!: boolean;

  @IsIn(SCOPE_RESPONSIBLE_PARTIES, {
    message: 'O risco cambial deve ser CONTRACTOR ou CLIENT',
  })
  currencyRiskParty!: ScopeResponsibleParty;

  @IsIn(SCOPE_RESPONSIBLE_PARTIES, {
    message: 'O risco de commodities deve ser CONTRACTOR ou CLIENT',
  })
  commodityRiskParty!: ScopeResponsibleParty;

  @IsOptional()
  @IsString({ message: 'As observações devem ser texto' })
  notes?: string | null;
}
