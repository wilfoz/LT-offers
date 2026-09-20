import { DATE_PATTERN } from '@lt-offers/domain';
import { Matches } from 'class-validator';
import { SoilTypeVersionFieldsDto } from './soil-type-version-fields.dto';

export class CreateSoilTypeVersionDto extends SoilTypeVersionFieldsDto {
  @Matches(DATE_PATTERN, {
    message: 'A data de início de vigência deve estar no formato AAAA-MM-DD',
  })
  effectiveFrom!: string;
}
