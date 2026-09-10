import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateNewRevisionDto {
  @IsOptional()
  @IsString({ message: 'As notas devem ser texto' })
  notes?: string | null;

  @IsOptional()
  @IsString({ message: 'O autor deve ser um texto' })
  @MaxLength(100, { message: 'O autor deve ter no máximo 100 caracteres' })
  createdBy?: string;
}
