import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export const PADRAO_DECIMAL_POSITIVO = /^\d+(\.\d+)?$/;
export const PADRAO_DATA = /^\d{4}-\d{2}-\d{2}$/;

const mensagemDecimal = (campo: string) =>
  `O campo ${campo} deve ser um número decimal positivo em formato texto, com ponto como separador (ex.: "12.34")`;

/**
 * Campos versionáveis do cabo condutor. Valores numéricos trafegam como
 * string decimal (design D3, RNF-08); null significa "não informado",
 * distinto de "0" (RNF-09).
 */
export class CamposVersaoDto {
  @IsOptional()
  @IsString({ message: 'A descrição deve ser um texto' })
  @MaxLength(200, { message: 'A descrição deve ter no máximo 200 caracteres' })
  descricao?: string | null;

  @IsOptional()
  @Matches(PADRAO_DECIMAL_POSITIVO, {
    message: mensagemDecimal('peso (ton/km)'),
  })
  pesoTonKm?: string | null;

  @IsOptional()
  @Matches(PADRAO_DECIMAL_POSITIVO, {
    message: mensagemDecimal('bobina (m)'),
  })
  bobinaM?: string | null;

  @IsOptional()
  @Matches(PADRAO_DECIMAL_POSITIVO, {
    message: mensagemDecimal('diâmetro (mm)'),
  })
  diametroMm?: string | null;

  @IsOptional()
  @Matches(PADRAO_DECIMAL_POSITIVO, {
    message: mensagemDecimal('UTS (kN)'),
  })
  utsKn?: string | null;
}
