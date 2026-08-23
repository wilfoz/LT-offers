import { Matches } from 'class-validator';
import { CamposVersaoDto, PADRAO_DATA } from './campos-versao.dto';

export class CriarVersaoDto extends CamposVersaoDto {
  @Matches(PADRAO_DATA, {
    message: 'A data de início de vigência deve estar no formato AAAA-MM-DD',
  })
  vigenciaInicio!: string;
}
