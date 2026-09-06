import { DATE_PATTERN } from '@lt-offers/domain';
import { Matches } from 'class-validator';
import { FixedCostVersionFieldsDto } from './fixed-cost-version-fields.dto';

export class CreateFixedCostVersionDto extends FixedCostVersionFieldsDto {
  @Matches(DATE_PATTERN, {
    message: 'A data de início de vigência deve estar no formato AAAA-MM-DD',
  })
  effectiveFrom!: string;
}
