/**
 * Resolução de vigência (spec catalogos/versionamento-vigencia): a versão
 * vigente para uma data de referência é a de maior vigenciaInicio menor ou
 * igual à data. Funções puras — a data de referência chega sempre como
 * parâmetro (design D2).
 */

export interface ComVigencia {
  vigenciaInicio: Date;
}

export function resolverVersaoVigente<T extends ComVigencia>(
  versoes: T[],
  dataReferencia: Date,
): T | undefined {
  return versoes
    .filter((v) => v.vigenciaInicio.getTime() <= dataReferencia.getTime())
    .sort((a, b) => b.vigenciaInicio.getTime() - a.vigenciaInicio.getTime())[0];
}

export interface CamposObrigatorios {
  descricao: string | null;
  pesoTonKm: unknown | null;
  bobinaM: unknown | null;
  diametroMm: unknown | null;
  utsKn: unknown | null;
}

const ROTULOS: Record<keyof CamposObrigatorios, string> = {
  descricao: 'descrição',
  pesoTonKm: 'peso (ton/km)',
  bobinaM: 'bobina (m)',
  diametroMm: 'diâmetro (mm)',
  utsKn: 'UTS (kN)',
};

function naoInformado(valor: unknown): boolean {
  if (valor === null || valor === undefined) {
    return true;
  }
  return typeof valor === 'string' && valor.trim() === '';
}

/** Campos obrigatórios não informados, para sinalização (RF-11, RNF-09). */
export function camposPendentes(versao: CamposObrigatorios): string[] {
  return (Object.keys(ROTULOS) as (keyof CamposObrigatorios)[])
    .filter((campo) => naoInformado(versao[campo]))
    .map((campo) => ROTULOS[campo]);
}
