import { DATE_PATTERN, POSITIVE_DECIMAL_PATTERN } from '../catalogs/validation';
import { BRAZILIAN_UFS } from '../schedule/rainfall-parameters';

/**
 * Contratos e funções puras do catálogo versionado de calendário de trabalho:
 * feriados, dias não laborais da semana e dias úteis padrão do mês, usados
 * para penalizar a produção mensal das equipes no cronograma (M07).
 * Datas trafegam como string civil AAAA-MM-DD; a aritmética usa meia-noite
 * UTC (mesma convenção do value object CivilDate da API) e nunca lê o relógio.
 */

/** Feriado com data civil; recorrente repete todo ano pelo par mês-dia. */
export interface HolidayContract {
  /** Data civil AAAA-MM-DD (para recorrentes, o ano é apenas referência). */
  date: string;
  name: string;
  recurring: boolean;
  /** null = nacional; preenchida = aplicável só a linhas daquela UF. */
  uf: string | null;
}

/** Calendário de trabalho vigente em uma data. */
export interface WorkCalendarParameters {
  /** Denominador do fator de calendário (RNF-08), ex.: "22.00". */
  standardWorkingDaysPerMonth: string;
  /** Dias da semana não laborais: 0 = domingo .. 6 = sábado. */
  nonWorkingWeekdays: number[];
  holidays: HolidayContract[];
}

/**
 * Feriados nacionais brasileiros de data fixa (recorrentes). O ano 2020 é
 * apenas referência do par mês-dia; feriados móveis (Carnaval, Corpus
 * Christi) são cadastrados por ano pelo usuário.
 */
export const DEFAULT_NATIONAL_HOLIDAYS: HolidayContract[] = [
  {
    date: '2020-01-01',
    name: 'Confraternização Universal',
    recurring: true,
    uf: null,
  },
  { date: '2020-04-21', name: 'Tiradentes', recurring: true, uf: null },
  { date: '2020-05-01', name: 'Dia do Trabalho', recurring: true, uf: null },
  {
    date: '2020-09-07',
    name: 'Independência do Brasil',
    recurring: true,
    uf: null,
  },
  {
    date: '2020-10-12',
    name: 'Nossa Senhora Aparecida',
    recurring: true,
    uf: null,
  },
  { date: '2020-11-02', name: 'Finados', recurring: true, uf: null },
  {
    date: '2020-11-15',
    name: 'Proclamação da República',
    recurring: true,
    uf: null,
  },
  {
    date: '2020-11-20',
    name: 'Dia Nacional de Zumbi e da Consciência Negra',
    recurring: true,
    uf: null,
  },
  { date: '2020-12-25', name: 'Natal', recurring: true, uf: null },
];

/** Calendário default (seed e testes — fonte única): sábado e domingo não laborais. */
export const DEFAULT_WORK_CALENDAR: WorkCalendarParameters = {
  standardWorkingDaysPerMonth: '22.00',
  nonWorkingWeekdays: [0, 6],
  holidays: DEFAULT_NATIONAL_HOLIDAYS,
};

/**
 * Valida uma data civil AAAA-MM-DD por round-trip de calendário: rejeita
 * formatos inválidos e datas inexistentes como 2027-02-30 (sem rollover).
 */
export function isValidCivilDate(text: string): boolean {
  if (!DATE_PATTERN.test(text)) {
    return false;
  }
  const date = new Date(`${text}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === text
  );
}

/** Mês civil identificado por ano e mês (1 = janeiro .. 12 = dezembro). */
export interface CivilMonth {
  year: number;
  month: number;
}

/**
 * Resolve o mês civil do mês N do projeto (1-indexado) ancorado na data de
 * início do cronograma: mês 1 = mês civil da data de início.
 */
export function civilMonthOfProjectMonth(
  scheduleStartDate: string,
  projectMonth: number,
): CivilMonth {
  const start = new Date(`${scheduleStartDate}T00:00:00.000Z`);
  const zeroBased =
    start.getUTCFullYear() * 12 + start.getUTCMonth() + (projectMonth - 1);
  return { year: Math.floor(zeroBased / 12), month: (zeroBased % 12) + 1 };
}

/** Quantidade de dias do mês civil (fevereiro respeita anos bissextos). */
export function daysInCivilMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Datas (dia do mês) dos feriados aplicáveis a um mês civil e UF:
 * recorrentes casam pelo par mês-dia em qualquer ano (29/02 recorrente só
 * existe em ano bissexto); não recorrentes casam pela data exata; feriado
 * com UF só se aplica quando coincide com a UF da linha.
 */
export function applicableHolidayDays(
  holidays: HolidayContract[],
  civilMonth: CivilMonth,
  uf: string | null,
): number[] {
  const days = new Set<number>();
  for (const holiday of holidays) {
    if (holiday.uf !== null && holiday.uf !== uf) {
      continue;
    }
    const holidayYear = Number(holiday.date.slice(0, 4));
    const holidayMonth = Number(holiday.date.slice(5, 7));
    const holidayDay = Number(holiday.date.slice(8, 10));
    if (holidayMonth !== civilMonth.month) {
      continue;
    }
    if (!holiday.recurring && holidayYear !== civilMonth.year) {
      continue;
    }
    if (holidayDay > daysInCivilMonth(civilMonth.year, civilMonth.month)) {
      continue;
    }
    days.add(holidayDay);
  }
  return [...days].sort((a, b) => a - b);
}

/**
 * Deriva os dias úteis de um mês civil: total de dias do mês, menos os que
 * caem em dias não laborais da semana, menos os feriados aplicáveis que caem
 * em dia que seria laboral — sem dupla contagem (feriado em dia não laboral
 * não desconta novamente).
 */
export function workingDaysInMonth(
  calendar: WorkCalendarParameters,
  civilMonth: CivilMonth,
  uf: string | null,
): number {
  const nonWorking = new Set(calendar.nonWorkingWeekdays);
  const holidayDays = new Set(
    applicableHolidayDays(calendar.holidays, civilMonth, uf),
  );
  const totalDays = daysInCivilMonth(civilMonth.year, civilMonth.month);

  let workingDays = 0;
  for (let day = 1; day <= totalDays; day++) {
    const weekday = new Date(
      Date.UTC(civilMonth.year, civilMonth.month - 1, day),
    ).getUTCDay();
    if (nonWorking.has(weekday) || holidayDays.has(day)) {
      continue;
    }
    workingDays++;
  }
  return workingDays;
}

/**
 * Violações estruturais do calendário de trabalho. As mensagens em pt-BR
 * (RNF-14) são responsabilidade da borda consumidora.
 */
export type WorkCalendarViolation =
  | { code: 'standard-days-invalid' }
  | { code: 'standard-days-not-positive' }
  | { code: 'weekday-out-of-range'; weekday: number }
  | { code: 'weekday-duplicated'; weekday: number }
  | { code: 'all-weekdays-non-working' }
  | { code: 'holiday-date-invalid'; index: number }
  | { code: 'holiday-name-empty'; index: number }
  | { code: 'holiday-uf-unknown'; index: number };

/** Valida a estrutura completa do calendário de trabalho. */
export function validateWorkCalendar(
  params: WorkCalendarParameters,
): WorkCalendarViolation[] {
  const violations: WorkCalendarViolation[] = [];

  if (!POSITIVE_DECIMAL_PATTERN.test(params.standardWorkingDaysPerMonth)) {
    violations.push({ code: 'standard-days-invalid' });
  } else if (Number(params.standardWorkingDaysPerMonth) <= 0) {
    violations.push({ code: 'standard-days-not-positive' });
  }

  const seen = new Set<number>();
  for (const weekday of params.nonWorkingWeekdays) {
    if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
      violations.push({ code: 'weekday-out-of-range', weekday });
      continue;
    }
    if (seen.has(weekday)) {
      violations.push({ code: 'weekday-duplicated', weekday });
      continue;
    }
    seen.add(weekday);
  }
  if (seen.size === 7) {
    violations.push({ code: 'all-weekdays-non-working' });
  }

  params.holidays.forEach((holiday, index) => {
    if (!isValidCivilDate(holiday.date)) {
      violations.push({ code: 'holiday-date-invalid', index });
    }
    if (holiday.name.trim() === '') {
      violations.push({ code: 'holiday-name-empty', index });
    }
    if (
      holiday.uf !== null &&
      !(BRAZILIAN_UFS as readonly string[]).includes(holiday.uf)
    ) {
      violations.push({ code: 'holiday-uf-unknown', index });
    }
  });

  return violations;
}
