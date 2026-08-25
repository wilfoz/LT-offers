import { DATE_PATTERN } from '@lt-offers/domain';
import { Matches } from 'class-validator';
import { InsulatorVersionFieldsDto } from './insulator-version-fields.dto';

export class CreateInsulatorVersionDto extends InsulatorVersionFieldsDto {
  @Matches(DATE_PATTERN, {
    message: 'A data de início de vigência deve estar no formato AAAA-MM-DD',
  })
  effectiveFrom!: string;
}
