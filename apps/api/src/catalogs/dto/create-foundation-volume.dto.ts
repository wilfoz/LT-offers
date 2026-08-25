import { DATE_PATTERN } from '@lt-offers/domain';
import { IsInt, IsOptional, Matches, Min } from 'class-validator';
import { FoundationVolumeQuantitiesDto } from './foundation-volume-quantities.dto';

const referenceMessage = (field: string) =>
  `O ${field} é obrigatório e deve ser um identificador numérico`;

export class CreateFoundationVolumeDto extends FoundationVolumeQuantitiesDto {
  @IsInt({ message: referenceMessage('tipo de torre') })
  @Min(1, { message: referenceMessage('tipo de torre') })
  towerTypeId!: number;

  @IsInt({ message: referenceMessage('tipo de solo') })
  @Min(1, { message: referenceMessage('tipo de solo') })
  soilTypeId!: number;

  @IsInt({ message: referenceMessage('tipo de fundação') })
  @Min(1, { message: referenceMessage('tipo de fundação') })
  foundationTypeId!: number;

  @IsOptional()
  @Matches(DATE_PATTERN, {
    message: 'A data de início de vigência deve estar no formato AAAA-MM-DD',
  })
  effectiveFrom?: string;
}
