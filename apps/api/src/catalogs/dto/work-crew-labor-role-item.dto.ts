import { IsInt, Min, Validate } from 'class-validator';
import { PositiveNonZeroDecimal } from './decimal-scale.validators';

export class WorkCrewLaborRoleItemDto {
  @IsInt({ message: 'O identificador do cargo de mão de obra deve ser um número inteiro' })
  @Min(1, { message: 'O identificador do cargo de mão de obra é inválido' })
  laborRoleId!: number;

  @Validate(PositiveNonZeroDecimal, [2], {
    message: 'A quantidade de mão de obra deve ser um número decimal maior que zero com no máximo 2 casas decimais',
  })
  quantity!: string;
}
