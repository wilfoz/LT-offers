import { IsEmpty, Matches } from 'class-validator';
import { DATE_PATTERN } from './version-fields.dto';
import { GroundWireVersionFieldsDto } from './ground-wire-version-fields.dto';

export class CreateGroundWireVersionDto extends GroundWireVersionFieldsDto {
  @Matches(DATE_PATTERN, {
    message: 'A data de início de vigência deve estar no formato AAAA-MM-DD',
  })
  effectiveFrom!: string;

  // O tipo pertence à identidade do item: declarado aqui apenas para que o
  // ValidationPipe (whitelist) não o descarte em silêncio — informar o campo
  // em nova versão é rejeitado com mensagem, cumprindo o cenário do spec.
  @IsEmpty({
    message:
      'O tipo é fixo desde a criação e não pode ser alterado; para outro tipo, crie um novo item',
  })
  type?: unknown;
}
