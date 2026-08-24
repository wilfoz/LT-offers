import { DATE_PATTERN } from '@lt-offers/domain';
import { Matches } from 'class-validator';
import { GuyWireVersionFieldsDto } from './guy-wire-version-fields.dto';

export class CreateGuyWireVersionDto extends GuyWireVersionFieldsDto {
  @Matches(DATE_PATTERN, {
    message: 'A data de início de vigência deve estar no formato AAAA-MM-DD',
  })
  effectiveFrom!: string;
}
