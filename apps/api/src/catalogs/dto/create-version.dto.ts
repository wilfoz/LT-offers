import { Matches } from 'class-validator';
import { DATE_PATTERN, VersionFieldsDto } from './version-fields.dto';

export class CreateVersionDto extends VersionFieldsDto {
  @Matches(DATE_PATTERN, {
    message: 'A data de início de vigência deve estar no formato AAAA-MM-DD',
  })
  effectiveFrom!: string;
}
