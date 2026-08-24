import { DATE_PATTERN } from '@lt-offers/domain';
import { BadRequestException } from '@nestjs/common';

export const BUSINESS_TIMEZONE = 'America/Sao_Paulo';

/**
 * Converte texto AAAA-MM-DD em data civil (meia-noite UTC), rejeitando datas
 * de calendário inválidas: new Date('2026-02-30') sofreria rollover
 * silencioso para 2026-03-02, corrompendo a vigência imutável (RNF-05).
 */
export function toCivilDate(text: string): Date {
  const date = new Date(`${text}T00:00:00.000Z`);
  const valid =
    DATE_PATTERN.test(text) &&
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === text;
  if (!valid) {
    throw new BadRequestException(
      `Data inválida: "${text}"; informe uma data real no formato AAAA-MM-DD`,
    );
  }
  return date;
}

/**
 * Data civil de hoje no fuso do negócio. new Date() puro é um instante UTC:
 * entre 21h e 24h em BRT ele já pertence ao dia seguinte em UTC, e a
 * vigência seria gravada com a data errada.
 */
export function todayCivilDate(now: Date = new Date()): Date {
  const text = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIMEZONE,
  }).format(now);
  return new Date(`${text}T00:00:00.000Z`);
}
