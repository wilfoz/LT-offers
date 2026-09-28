/**
 * Derivações puras da revisão de oferta (RN-02, RNF-08, RNF-09): deságio da
 * RAP, data-limite contratual do edital e alertas de prazo. Consumidas pela
 * API (presenter) e pela web (pré-visualização), com uma única implementação.
 * Ausência ou invalidez de entrada resulta em null — nunca zero silencioso.
 */

import { Decimal } from 'decimal.js';
import { POSITIVE_DECIMAL_PATTERN } from '../catalogs/validation';
import { daysInCivilMonth, isValidCivilDate } from '../calendar/work-calendar';

export const SCHEDULE_WARNING_CODES = [
  'START_AFTER_COD',
  'DEADLINE_AFTER_COD',
  'START_BEFORE_SIGNING',
] as const;
export type ScheduleWarningCode = (typeof SCHEDULE_WARNING_CODES)[number];

/**
 * Alerta de prazo com código tipado e o valor derivado usado na checagem;
 * as mensagens em pt-BR ficam nas bordas (web e API).
 */
export interface ScheduleWarning {
  code: ScheduleWarningCode;
  /** Data-limite contratual derivada, presente em DEADLINE_AFTER_COD. */
  contractualDeadlineDate?: string;
}

export interface ScheduleWarningInput {
  scheduleStartDate?: string | null;
  commercialOperationDate?: string | null;
  contractSigningDate?: string | null;
  constructionDeadlineMonths?: number | null;
}

/**
 * Deságio percentual da RAP: (1 − vencedora ÷ máxima) × 100 com 2 casas
 * (half-up). Null quando qualquer RAP está ausente/inválida ou a RAP máxima
 * é zero (RNF-09). Negativo quando a RAP estimada supera o teto do edital.
 */
export function discountPercent(
  maxRap: string | null | undefined,
  winningRap: string | null | undefined,
): string | null {
  if (
    maxRap == null ||
    winningRap == null ||
    !POSITIVE_DECIMAL_PATTERN.test(maxRap) ||
    !POSITIVE_DECIMAL_PATTERN.test(winningRap)
  ) {
    return null;
  }
  const max = new Decimal(maxRap);
  if (max.isZero()) {
    return null;
  }
  return new Decimal(1)
    .minus(new Decimal(winningRap).dividedBy(max))
    .times(100)
    .toFixed(2);
}

/**
 * Data-limite contratual (RN-02): assinatura do contrato acrescida do prazo
 * de construção em meses civis, com o dia limitado ao último dia do mês de
 * destino (ex.: 2027-01-31 + 1 mês = 2027-02-28). Null quando falta entrada,
 * a data é inválida ou o prazo não é um inteiro positivo.
 */
export function contractualDeadlineDate(
  signingDate: string | null | undefined,
  months: number | null | undefined,
): string | null {
  if (
    signingDate == null ||
    months == null ||
    !isValidCivilDate(signingDate) ||
    !Number.isInteger(months) ||
    months < 1
  ) {
    return null;
  }
  const [year, month, day] = signingDate.split('-').map(Number);
  const zeroBased = year * 12 + (month - 1) + months;
  const targetYear = Math.floor(zeroBased / 12);
  const targetMonth = (zeroBased % 12) + 1;
  const targetDay = Math.min(day, daysInCivilMonth(targetYear, targetMonth));
  return [
    String(targetYear).padStart(4, '0'),
    String(targetMonth).padStart(2, '0'),
    String(targetDay).padStart(2, '0'),
  ].join('-');
}

/**
 * Alertas de prazo do RN-02, informativos e não bloqueantes: (a) início do
 * cronograma após a entrada em operação do edital; (b) data-limite contratual
 * derivada após a entrada em operação; (c) início do cronograma antes da
 * assinatura do contrato. Datas inválidas ou ausentes não geram alerta.
 */
export function scheduleWarnings(
  input: ScheduleWarningInput,
): ScheduleWarning[] {
  const warnings: ScheduleWarning[] = [];
  const start = validCivilDateOrNull(input.scheduleStartDate);
  const cod = validCivilDateOrNull(input.commercialOperationDate);
  const signing = validCivilDateOrNull(input.contractSigningDate);
  // Comparações lexicográficas são seguras no formato AAAA-MM-DD.
  if (start != null && cod != null && start > cod) {
    warnings.push({ code: 'START_AFTER_COD' });
  }
  const deadline = contractualDeadlineDate(
    signing,
    input.constructionDeadlineMonths,
  );
  if (deadline != null && cod != null && deadline > cod) {
    warnings.push({
      code: 'DEADLINE_AFTER_COD',
      contractualDeadlineDate: deadline,
    });
  }
  if (start != null && signing != null && start < signing) {
    warnings.push({ code: 'START_BEFORE_SIGNING' });
  }
  return warnings;
}

function validCivilDateOrNull(value: string | null | undefined): string | null {
  return value != null && isValidCivilDate(value) ? value : null;
}
