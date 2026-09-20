import { DATE_PATTERN } from '@lt-offers/domain';
import { Matches } from 'class-validator';
import { WorkCrewVersionFieldsDto } from './work-crew-version-fields.dto';

export class CreateWorkCrewVersionDto extends WorkCrewVersionFieldsDto {
  @Matches(DATE_PATTERN, {
    message: 'A data de início de vigência deve estar no formato AAAA-MM-DD',
  })
  effectiveFrom!: string;
}
