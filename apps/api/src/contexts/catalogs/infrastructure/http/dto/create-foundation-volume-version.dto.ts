import { DATE_PATTERN } from '@lt-offers/domain';
import { IsEmpty, Matches } from 'class-validator';
import { FoundationVolumeQuantitiesDto } from './foundation-volume-quantities.dto';

const combinationImmutableMessage =
  'A combinação de tipo de torre, solo e fundação é fixa desde a criação e não pode ser alterada; para outra combinação, crie uma nova entrada';

export class CreateFoundationVolumeVersionDto extends FoundationVolumeQuantitiesDto {
  @Matches(DATE_PATTERN, {
    message: 'A data de início de vigência deve estar no formato AAAA-MM-DD',
  })
  effectiveFrom!: string;

  // A combinação pertence à identidade da entrada: os três ids são declarados
  // aqui apenas para que o ValidationPipe (whitelist) não os descarte em
  // silêncio — informá-los em nova versão é rejeitado com mensagem.
  @IsEmpty({ message: combinationImmutableMessage })
  towerTypeId?: unknown;

  @IsEmpty({ message: combinationImmutableMessage })
  soilTypeId?: unknown;

  @IsEmpty({ message: combinationImmutableMessage })
  foundationTypeId?: unknown;
}
