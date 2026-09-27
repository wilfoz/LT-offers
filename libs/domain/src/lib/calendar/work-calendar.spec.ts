import {
  DEFAULT_WORK_CALENDAR,
  WorkCalendarParameters,
  applicableHolidayDays,
  civilMonthOfProjectMonth,
  daysInCivilMonth,
  isValidCivilDate,
  validateWorkCalendar,
  workingDaysInMonth,
} from './work-calendar';

describe('Calendário de trabalho — contratos e funções puras (M07)', () => {
  describe('isValidCivilDate — round-trip de calendário', () => {
    it.each([
      ['2026-01-01', true],
      ['2024-02-29', true],
      ['2023-02-29', false],
      ['2027-02-30', false],
      ['2026-13-45', false],
      ['26-01-01', false],
      ['2026/01/01', false],
    ])('data "%s" deve ser válida = %s', (text, expected) => {
      expect(isValidCivilDate(text as string)).toBe(expected);
    });
  });

  describe('civilMonthOfProjectMonth — ancoragem do mês do projeto', () => {
    it('mês 4 do projeto iniciado em 2027-03-15 deve resolver junho de 2027', () => {
      expect(civilMonthOfProjectMonth('2027-03-15', 4)).toEqual({
        year: 2027,
        month: 6,
      });
    });

    it('mês 1 deve ser o próprio mês civil da data de início', () => {
      expect(civilMonthOfProjectMonth('2027-03-15', 1)).toEqual({
        year: 2027,
        month: 3,
      });
    });

    it('deve cruzar a virada de ano corretamente', () => {
      expect(civilMonthOfProjectMonth('2027-03-15', 11)).toEqual({
        year: 2028,
        month: 1,
      });
    });
  });

  describe('daysInCivilMonth', () => {
    it.each([
      [2026, 6, 30],
      [2026, 7, 31],
      [2024, 2, 29],
      [2026, 2, 28],
    ])('%s-%s deve ter %s dias', (year, month, expected) => {
      expect(daysInCivilMonth(year as number, month as number)).toBe(expected);
    });
  });

  describe('applicableHolidayDays — recorrência e escopo de UF', () => {
    it('feriado recorrente deve aplicar-se a qualquer ano pelo par mês-dia', () => {
      const holidays = [
        {
          date: '2020-01-01',
          name: 'Confraternização Universal',
          recurring: true,
          uf: null,
        },
      ];
      expect(
        applicableHolidayDays(holidays, { year: 2031, month: 1 }, 'MG'),
      ).toEqual([1]);
    });

    it('feriado não recorrente (móvel) só vale na data exata cadastrada', () => {
      const holidays = [
        { date: '2027-02-09', name: 'Carnaval', recurring: false, uf: null },
      ];
      expect(
        applicableHolidayDays(holidays, { year: 2027, month: 2 }, 'MG'),
      ).toEqual([9]);
      expect(
        applicableHolidayDays(holidays, { year: 2028, month: 2 }, 'MG'),
      ).toEqual([]);
    });

    it('feriado estadual só se aplica quando coincide com a UF da linha', () => {
      const holidays = [
        {
          date: '2026-07-02',
          name: 'Independência da Bahia',
          recurring: true,
          uf: 'BA',
        },
      ];
      expect(
        applicableHolidayDays(holidays, { year: 2026, month: 7 }, 'BA'),
      ).toEqual([2]);
      expect(
        applicableHolidayDays(holidays, { year: 2026, month: 7 }, 'MG'),
      ).toEqual([]);
    });

    it('feriado recorrente em 29/02 só existe em ano bissexto', () => {
      const holidays = [
        {
          date: '2024-02-29',
          name: 'Feriado hipotético',
          recurring: true,
          uf: null,
        },
      ];
      expect(
        applicableHolidayDays(holidays, { year: 2028, month: 2 }, null),
      ).toEqual([29]);
      expect(
        applicableHolidayDays(holidays, { year: 2026, month: 2 }, null),
      ).toEqual([]);
    });
  });

  describe('workingDaysInMonth — derivação de dias úteis', () => {
    // Junho de 2026: 30 dias, começa numa segunda-feira — 4 sábados e
    // 4 domingos (8 dias não laborais), 22 dias úteis antes de feriados.
    const baseCalendar: WorkCalendarParameters = {
      standardWorkingDaysPerMonth: '22.00',
      nonWorkingWeekdays: [0, 6],
      holidays: [],
    };

    it('mês sem feriados deve descontar apenas os dias não laborais da semana', () => {
      expect(
        workingDaysInMonth(baseCalendar, { year: 2026, month: 6 }, 'MG'),
      ).toBe(22);
    });

    it('mês com 2 feriados em dias laborais deve derivar 20 dias úteis', () => {
      const calendar: WorkCalendarParameters = {
        ...baseCalendar,
        holidays: [
          { date: '2026-06-10', name: 'Feriado A', recurring: false, uf: null },
          { date: '2026-06-11', name: 'Feriado B', recurring: false, uf: null },
        ],
      };
      expect(workingDaysInMonth(calendar, { year: 2026, month: 6 }, 'MG')).toBe(
        20,
      );
    });

    it('feriado em dia não laboral não desconta duas vezes', () => {
      const calendar: WorkCalendarParameters = {
        ...baseCalendar,
        holidays: [
          // 2026-06-07 é um domingo, já não laboral.
          {
            date: '2026-06-07',
            name: 'Feriado no domingo',
            recurring: false,
            uf: null,
          },
        ],
      };
      expect(workingDaysInMonth(calendar, { year: 2026, month: 6 }, 'MG')).toBe(
        22,
      );
    });

    it('dois feriados no mesmo dia (nacional e estadual) descontam um único dia', () => {
      const calendar: WorkCalendarParameters = {
        ...baseCalendar,
        holidays: [
          {
            date: '2026-06-10',
            name: 'Feriado nacional',
            recurring: false,
            uf: null,
          },
          {
            date: '2026-06-10',
            name: 'Feriado estadual',
            recurring: false,
            uf: 'MG',
          },
        ],
      };
      expect(workingDaysInMonth(calendar, { year: 2026, month: 6 }, 'MG')).toBe(
        21,
      );
    });
  });

  describe('validateWorkCalendar — violações tipadas', () => {
    it('calendário default deve passar sem violações', () => {
      expect(validateWorkCalendar(DEFAULT_WORK_CALENDAR)).toEqual([]);
    });

    it('default deve ter sábado e domingo não laborais e 22,00 dias padrão', () => {
      expect(DEFAULT_WORK_CALENDAR.nonWorkingWeekdays).toEqual([0, 6]);
      expect(DEFAULT_WORK_CALENDAR.standardWorkingDaysPerMonth).toBe('22.00');
      expect(DEFAULT_WORK_CALENDAR.holidays.every((h) => h.recurring)).toBe(
        true,
      );
    });

    it('deve rejeitar dias úteis padrão zero ou inválidos', () => {
      expect(
        validateWorkCalendar({
          ...DEFAULT_WORK_CALENDAR,
          standardWorkingDaysPerMonth: '0',
        }),
      ).toContainEqual({ code: 'standard-days-not-positive' });
      expect(
        validateWorkCalendar({
          ...DEFAULT_WORK_CALENDAR,
          standardWorkingDaysPerMonth: 'abc',
        }),
      ).toContainEqual({ code: 'standard-days-invalid' });
    });

    it('deve rejeitar dia da semana fora de 0..6 e duplicado', () => {
      const violations = validateWorkCalendar({
        ...DEFAULT_WORK_CALENDAR,
        nonWorkingWeekdays: [0, 7, 0],
      });
      expect(violations).toContainEqual({
        code: 'weekday-out-of-range',
        weekday: 7,
      });
      expect(violations).toContainEqual({
        code: 'weekday-duplicated',
        weekday: 0,
      });
    });

    it('deve rejeitar todos os 7 dias não laborais (mês sem dia útil possível)', () => {
      expect(
        validateWorkCalendar({
          ...DEFAULT_WORK_CALENDAR,
          nonWorkingWeekdays: [0, 1, 2, 3, 4, 5, 6],
        }),
      ).toContainEqual({ code: 'all-weekdays-non-working' });
    });

    it('deve rejeitar feriado com data de calendário inexistente (2027-02-30)', () => {
      expect(
        validateWorkCalendar({
          ...DEFAULT_WORK_CALENDAR,
          holidays: [
            {
              date: '2027-02-30',
              name: 'Data impossível',
              recurring: false,
              uf: null,
            },
          ],
        }),
      ).toContainEqual({ code: 'holiday-date-invalid', index: 0 });
    });

    it('deve rejeitar feriado com nome vazio ou UF desconhecida', () => {
      const violations = validateWorkCalendar({
        ...DEFAULT_WORK_CALENDAR,
        holidays: [
          { date: '2026-06-10', name: '  ', recurring: false, uf: null },
          { date: '2026-06-11', name: 'Feriado', recurring: false, uf: 'ZZ' },
        ],
      });
      expect(violations).toContainEqual({
        code: 'holiday-name-empty',
        index: 0,
      });
      expect(violations).toContainEqual({
        code: 'holiday-uf-unknown',
        index: 1,
      });
    });
  });
});
