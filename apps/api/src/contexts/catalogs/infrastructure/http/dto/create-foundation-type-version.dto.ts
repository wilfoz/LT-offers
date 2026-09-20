import { DATE_PATTERN } from '@lt-offers/domain';
import { IsEmpty, Matches } from 'class-validator';
import { FoundationTypeVersionFieldsDto } from './foundation-type-version-fields.dto';

export class CreateFoundationTypeVersionDto extends FoundationTypeVersionFieldsDto {
  @Matches(DATE_PATTERN, {
    message: 'A data de início de vigência deve estar no formato AAAA-MM-DD',
  })
  effectiveFrom!: string;

  // A aplicação pertence à identidade do item: declarada aqui apenas para que
  // o ValidationPipe (whitelist) não a descarte em silêncio — informar o campo
  // em nova versão é rejeitado com mensagem, cumprindo o cenário do spec.
  @IsEmpty({
    message:
      'A aplicação é fixa desde a criação e não pode ser alterada; para outra aplicação, crie um novo tipo',
  })
  application?: unknown;
}
