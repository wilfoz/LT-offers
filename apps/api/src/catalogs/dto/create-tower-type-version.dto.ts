import { DATE_PATTERN } from '@lt-offers/domain';
import { IsEmpty, Matches } from 'class-validator';
import { TowerTypeVersionFieldsDto } from './tower-type-version-fields.dto';

export class CreateTowerTypeVersionDto extends TowerTypeVersionFieldsDto {
  @Matches(DATE_PATTERN, {
    message: 'A data de início de vigência deve estar no formato AAAA-MM-DD',
  })
  effectiveFrom!: string;

  // A função pertence à identidade do tipo: declarada aqui apenas para que o
  // ValidationPipe (whitelist) não a descarte em silêncio — informar o campo
  // em nova versão é rejeitado com mensagem, cumprindo o cenário do spec.
  @IsEmpty({
    message:
      'A função é fixa desde a criação e não pode ser alterada; para outra função, crie um novo tipo de torre',
  })
  function?: unknown;
}
