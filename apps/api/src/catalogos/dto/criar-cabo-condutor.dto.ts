import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { CamposVersaoDto, PADRAO_DATA } from './campos-versao.dto';

export class CriarCaboCondutorDto extends CamposVersaoDto {
  @IsString({ message: 'O código deve ser um texto' })
  @IsNotEmpty({ message: 'O código é obrigatório' })
  @MaxLength(50, { message: 'O código deve ter no máximo 50 caracteres' })
  codigo!: string;

  @IsOptional()
  @Matches(PADRAO_DATA, {
    message: 'A data de início de vigência deve estar no formato AAAA-MM-DD',
  })
  vigenciaInicio?: string;
}
