/**
 * Formatadores pt-BR de exibição (RNF-09, RNF-14): nulo permanece
 * "não informado" — nunca zero. Extraído na 3ª ocorrência (histórico de
 * leilões, benchmark da oferta e viabilidade M13 — regra das três).
 */

const NEGATIVE_ZERO_PATTERN = /^-0(\.0+)?$/;

/** Zero negativo ("-0.00") é artefato de arredondamento; exibe sem sinal. */
function stripNegativeZero(value: string): string {
  return NEGATIVE_ZERO_PATTERN.test(value) ? value.slice(1) : value;
}

/** Formato monetário pt-BR; nulo permanece "não informado" (RNF-09). */
export function formatMoney(value: string | null): string {
  if (value === null) return 'não informado';
  return Number(stripNegativeZero(value)).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Percentual pt-BR ("34.88" → "34,88%"); nulo = "não informado". */
export function formatPercent(value: string | null): string {
  if (value === null) return 'não informado';
  return `${stripNegativeZero(value).replace('.', ',')}%`;
}

/** Pontos percentuais pt-BR ("2.44" → "2,44 p.p."); nulo = "não informado". */
export function formatPoints(value: string | null): string {
  if (value === null) return 'não informado';
  return `${stripNegativeZero(value).replace('.', ',')} p.p.`;
}
