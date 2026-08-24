import { DATE_PATTERN } from '@lt-offers/domain';
import { Matches } from 'class-validator';
import { StructureSeriesVersionFieldsDto } from './structure-series-version-fields.dto';

export class CreateStructureSeriesVersionDto extends StructureSeriesVersionFieldsDto {
  @Matches(DATE_PATTERN, {
    message: 'A data de início de vigência deve estar no formato AAAA-MM-DD',
  })
  effectiveFrom!: string;
}
