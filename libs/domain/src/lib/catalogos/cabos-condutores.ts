/**
 * Contratos do catálogo de cabos condutores trocados entre api e web.
 * Valores numéricos trafegam como string decimal (design D3, RNF-08);
 * null significa "não informado", distinto de "0" (RNF-09).
 */

export interface VersaoCaboCondutor {
  id: number;
  descricao: string | null;
  pesoTonKm: string | null;
  bobinaM: string | null;
  diametroMm: string | null;
  utsKn: string | null;
  vigenciaInicio: string;
  criadoPor: string;
  criadoEm: string;
}

export interface CaboCondutorResumo {
  id: number;
  codigo: string;
  versaoVigente: VersaoCaboCondutor | null;
  camposPendentes: string[];
}

export interface HistoricoCaboCondutor {
  id: number;
  codigo: string;
  versoes: VersaoCaboCondutor[];
}

export interface DadosVersaoCaboCondutor {
  descricao?: string | null;
  pesoTonKm?: string | null;
  bobinaM?: string | null;
  diametroMm?: string | null;
  utsKn?: string | null;
  vigenciaInicio?: string;
}

/** Nova versão de item existente: a data de vigência é obrigatória. */
export interface DadosNovaVersaoCaboCondutor extends DadosVersaoCaboCondutor {
  vigenciaInicio: string;
}

export interface DadosNovoCaboCondutor extends DadosVersaoCaboCondutor {
  codigo: string;
}
