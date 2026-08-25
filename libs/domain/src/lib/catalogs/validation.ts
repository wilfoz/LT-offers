/**
 * Patterns de validação compartilhados entre api (DTOs) e web (forms) para
 * os catálogos versionados. Apenas os patterns: as mensagens em pt-BR
 * (RNF-14) são responsabilidade de cada borda consumidora.
 */

/** Número decimal positivo em texto, ponto como separador (RNF-08). */
export const POSITIVE_DECIMAL_PATTERN = /^\d+(\.\d+)?$/;

/** Inteiro positivo (contagens: fios, fibras). */
export const POSITIVE_INT_PATTERN = /^[1-9]\d*$/;

/** Inteiro maior ou igual a zero (contagens em que zero é válido: estais, RNF-09). */
export const NON_NEGATIVE_INT_PATTERN = /^(0|[1-9]\d*)$/;

/** Data civil no formato AAAA-MM-DD (validação de calendário é da borda). */
export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Violação da regra "decimal em texto com escala limitada à precisão da
 * coluna" (RNF-08 — sem o limite, o Postgres arredondaria casas excedentes em
 * silêncio). null = valor válido. As mensagens em pt-BR (RNF-14) e o formato
 * do erro são responsabilidade de cada borda consumidora.
 */
export type DecimalScaleViolation =
  'not-decimal' | 'not-positive' | 'scale-exceeded' | null;

/**
 * Fonte única da validação de escala usada por API (DTOs) e web (forms).
 * `nonZero: true` para campos onde zero também é inválido (ex.: tabela
 * peso × altura); sem a opção, "0" é valor informado válido (RNF-09).
 */
export function decimalScaleViolation(
  value: string,
  maxScale: number,
  options: { nonZero?: boolean } = {},
): DecimalScaleViolation {
  if (!POSITIVE_DECIMAL_PATTERN.test(value)) {
    return 'not-decimal';
  }
  if (options.nonZero && Number(value) <= 0) {
    return 'not-positive';
  }
  const decimals = value.split('.')[1] ?? '';
  return decimals.length <= maxScale ? null : 'scale-exceeded';
}
