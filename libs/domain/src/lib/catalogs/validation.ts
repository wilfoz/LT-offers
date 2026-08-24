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
