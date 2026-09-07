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
  @IsInt({ message: 'O identificador do item de escopo deve ser inteiro' })
  id?: number;

  @IsString({ message: 'O código do item de escopo deve ser um texto' })
  @IsNotEmpty({ message: 'O código do item de escopo é obrigatório' })
  @MaxLength(50, {
    message: 'O código do item de escopo deve ter no máximo 50 caracteres',
  })
  itemCode!: string;

  @IsString({ message: 'O nome do item de escopo deve ser um texto' })
  @IsNotEmpty({ message: 'O nome do item de escopo é obrigatório' })
  @MaxLength(200, {
    message: 'O nome do item de escopo deve ter no máximo 200 caracteres',
  })
  itemName!: string;

  @IsString({ message: 'A categoria do item deve ser um texto' })
  @IsNotEmpty({ message: 'A categoria do item é obrigatória' })
  @MaxLength(100, {
    message: 'A categoria deve ter no máximo 100 caracteres',
  })
  category!: string;

  @IsIn(SCOPE_RESPONSIBLE_PARTIES, {
    message: 'O responsável deve ser CONTRACTOR ou CLIENT',
  })
  responsibleParty!: ScopeResponsibleParty;

  @IsBoolean({
    message: 'O aceite de faturamento direto deve ser verdadeiro ou falso',
  })
  acceptsDirectBilling!: boolean;

  @IsIn(SCOPE_RESPONSIBLE_PARTIES, {
    message: 'A parte do risco cambial deve ser CONTRACTOR ou CLIENT',
  })
  currencyRiskParty!: ScopeResponsibleParty;

  @IsIn(SCOPE_RESPONSIBLE_PARTIES, {
    message: 'A parte do risco de commodity deve ser CONTRACTOR ou CLIENT',
  })
  commodityRiskParty!: ScopeResponsibleParty;

  @IsOptional()
  @IsString({ message: 'As observações devem ser texto' })
  notes?: string | null;
}
