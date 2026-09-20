import { DATE_PATTERN } from '@lt-offers/domain';
import { Matches } from 'class-validator';
import { LaborRoleVersionFieldsDto } from './labor-role-version-fields.dto';

export class CreateLaborRoleVersionDto extends LaborRoleVersionFieldsDto {
  @Matches(DATE_PATTERN, {
    message: 'A data de início de vigência deve estar no formato AAAA-MM-DD',
  })
  effectiveFrom!: string;
}
