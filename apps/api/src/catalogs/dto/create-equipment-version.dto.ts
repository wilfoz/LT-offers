import { DATE_PATTERN } from '@lt-offers/domain';
import { Matches } from 'class-validator';
import { EquipmentVersionFieldsDto } from './equipment-version-fields.dto';

export class CreateEquipmentVersionDto extends EquipmentVersionFieldsDto {
  @Matches(DATE_PATTERN, {
    message: 'A data de início de vigência deve estar no formato AAAA-MM-DD',
  })
  effectiveFrom!: string;
}
