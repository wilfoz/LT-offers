import { DATE_PATTERN } from '@lt-offers/domain';
import { Matches } from 'class-validator';
import { VersionFieldsDto } from './version-fields.dto';

export class CreateVersionDto extends VersionFieldsDto {
  @Matches(DATE_PATTERN, {
    message: 'A data de início de vigência deve estar no formato AAAA-MM-DD',
  })
  effectiveFrom!: string;
}
