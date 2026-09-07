import { IsInt, Min, Validate } from 'class-validator';
import { PositiveNonZeroDecimal } from './decimal-scale.validators';

export class WorkCrewEquipmentItemDto {
  @IsInt({
    message: 'O identificador do equipamento deve ser um número inteiro',
  })
  @Min(1, { message: 'O identificador do equipamento é inválido' })
  equipmentId!: number;

  @Validate(PositiveNonZeroDecimal, [2], {
    message:
      'A quantidade de equipamento deve ser um número decimal maior que zero com no máximo 2 casas decimais',
  })
  quantity!: string;
}
