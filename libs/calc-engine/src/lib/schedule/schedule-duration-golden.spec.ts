import {
  DEFAULT_RAINFALL_PARAMETERS,
  DEFAULT_RAINFALL_SEVERITY_BANDS,
  DEFAULT_WORK_CALENDAR,
  RainfallParameters,
  WorkCalendarParameters,
} from '@lt-offers/domain';
import { DecimalValue } from '../decimal-value';
import { PrecipitationCalculator } from './precipitation-calculator';
import { ScheduleCalculator } from './schedule-calculator';

/**
 * Testes golden do método de duração (RF-36, RN-16): quantificam o desvio
 * entre o método legado (média de fator de chuva em janela fixa de 6 meses)
 * e o consumo do quantitativo mês a mês, e cobrem os cenários do delta de
 * spec `cronograma` desta change.
 */

/** Parâmetros com série de chuva sob medida para a UF de teste. */
function customRainfall(
  monthlyMm: string[],
  bands = DEFAULT_RAINFALL_SEVERITY_BANDS,
): RainfallParameters {
  return { bands, ufSeries: [{ uf: 'MG', monthlyMm }] };
}

/** Reproduz o método legado: média de 6 meses + divisão com teto. */
function legacyDuration(
  totalQuantity: string,
  nominalPerCrew: string,
  crewCount: number,
  uf: string,
  startMonth: number,
  params: RainfallParameters,
): number {
  const avgFactor = PrecipitationCalculator.getAverageProductivityFactor(
    uf,
    startMonth,
    6,
    params,
  );
  const effective = DecimalValue.of(nominalPerCrew)
    .times(DecimalValue.of(crewCount))
    .times(avgFactor);
  return Math.max(
    1,
    Math.ceil(DecimalValue.of(totalQuantity).dividedBy(effective).toNumber()),
  );
}

function baseActivity(overrides: Record<string, unknown> = {}) {
  return {
    id: 'act-golden',
    code: 'CIV-01',
    name: 'Escavação de Fundações',
    group: 'CIVIL_WORKS' as const,
    quantitySource: 'TOTAL_FOUNDATIONS',
    totalQuantity: '100.00',
    quantityUnit: 'fundações',
    crewCount: 1,
    nominalMonthlyProductionPerCrew: '10.00',
    startMonth: 1,
    monthlyCostPerCrew: '50000.00',
    ...overrides,
  };
}

function calculate(overrides: Record<string, unknown> = {}) {
  return ScheduleCalculator.calculateSchedule({
    lineId: 1,
    uf: 'MG',
    startMonth: 1,
    rainfallParameters: DEFAULT_RAINFALL_PARAMETERS,
    workCalendar: DEFAULT_WORK_CALENDAR,
    activities: [baseActivity()],
    ...overrides,
  } as Parameters<typeof ScheduleCalculator.calculateSchedule>[0]);
}

describe('Golden: método legado (média 6 meses) × consumo mês a mês (RF-36, RN-16)', () => {
  it('fixture curta (120 fundações, MG, início em fevereiro): métodos coincidem em 7 meses', () => {
    const legacy = legacyDuration(
      '120.00',
      '10.00',
      2,
      'MG',
      2,
      DEFAULT_RAINFALL_PARAMETERS,
    );

    const summary = calculate({
      activities: [
        baseActivity({
          totalQuantity: '120.00',
          crewCount: 2,
          startMonth: 2,
        }),
      ],
    });

    expect(legacy).toBe(7);
    expect(summary.activities[0].durationMonths).toBe(7);
  });

  it('fixture longa (200 unidades cruzando dois períodos chuvosos): legado subestima em 2 meses', () => {
    // A janela fixa de 6 meses a partir de maio (estação seca de MG) não
    // enxerga os meses severos seguintes — o consumo mês a mês enxerga.
    const legacy = legacyDuration(
      '200.00',
      '10.00',
      1,
      'MG',
      5,
      DEFAULT_RAINFALL_PARAMETERS,
    );

    const summary = calculate({
      startMonth: 5,
      activities: [baseActivity({ totalQuantity: '200.00', startMonth: 5 })],
    });

    expect(legacy).toBe(21);
    expect(summary.activities[0].durationMonths).toBe(23);
    expect(summary.activities[0].durationMonths - legacy).toBe(2);
  });
});

describe('Consumo mês a mês com fatores variáveis por mês civil (delta cronograma)', () => {
  it('60 unidades com fatores 1,00, 1,00, 0,65, 0,65, 1,00... duram 7 meses (não 6 da média fixa)', () => {
    // Série sob medida: jan/fev secos, mar/abr severos (fator 0,65), resto seco.
    const params = customRainfall([
      '10',
      '10',
      '310',
      '310',
      '10',
      '10',
      '10',
      '10',
      '10',
      '10',
      '10',
      '10',
    ]);

    const summary = calculate({
      rainfallParameters: params,
      activities: [baseActivity({ totalQuantity: '60.00' })],
    });

    const act = summary.activities[0];
    // Consumo: 10 + 10 + 6,5 + 6,5 + 10 + 10 = 53; o 7º mês fecha o saldo.
    expect(act.durationMonths).toBe(7);
    expect(act.monthlyBreakdown).toHaveLength(7);
    expect(act.monthlyBreakdown?.[2].rainfallFactor).toBe('0.6500');
    expect(act.monthlyBreakdown?.[2].effectiveProduction).toBe('6.50');
    expect(act.monthlyBreakdown?.[6].plannedProduction).toBe('7.00');
  });

  it('mês com produção efetiva zero não trava o cálculo: alerta explícito e avanço sem consumo', () => {
    const zeroBands = DEFAULT_RAINFALL_SEVERITY_BANDS.map((b) =>
      b.position === 5 ? { ...b, productivityFactor: '0' } : b,
    );
    // Fevereiro severo (350 mm) com fator zerado pelo usuário.
    const params = customRainfall(
      ['10', '350', '10', '10', '10', '10', '10', '10', '10', '10', '10', '10'],
      zeroBands,
    );

    const summary = calculate({
      rainfallParameters: params,
      activities: [baseActivity({ totalQuantity: '20.00' })],
    });

    const act = summary.activities[0];
    expect(act.durationMonths).toBe(3); // meses 1 e 3 produzem; mês 2 parado
    expect(act.monthlyBreakdown?.[1].effectiveProduction).toBe('0.00');
    expect(act.statusNotes?.[0]).toContain('mês 2 sem produção efetiva');
    expect(
      summary.warnings.some((w) => w.includes('mês 2 sem produção efetiva')),
    ).toBe(true);
  });

  it('atividade com fator zerado permanente aborta com erro explícito no horizonte de 600 meses', () => {
    const zeroBands = DEFAULT_RAINFALL_SEVERITY_BANDS.map((b) =>
      b.position === 5 ? { ...b, productivityFactor: '0' } : b,
    );
    const params = customRainfall(Array(12).fill('350'), zeroBands);

    expect(() => calculate({ rainfallParameters: params })).toThrow(
      'horizonte máximo de 600 meses',
    );
  });

  it('grupos de custo fixo (Indiretos) ficam fora da penalização de chuva e calendário', () => {
    // Chuva severa o ano todo (fator 0,65): a atividade INDIRECTS não é
    // penalizada (18 meses), enquanto a de produção estende para 28.
    const params = customRainfall(Array(12).fill('350'));

    const summary = calculate({
      rainfallParameters: params,
      activities: [
        baseActivity({
          id: 'act-ind',
          code: 'IND-01',
          name: 'Gestão e Apoio Indireto',
          group: 'INDIRECTS',
          totalQuantity: '18.00',
          quantityUnit: 'meses',
          nominalMonthlyProductionPerCrew: '1.00',
        }),
        baseActivity({
          id: 'act-civ',
          totalQuantity: '18.00',
          quantityUnit: 'meses',
          nominalMonthlyProductionPerCrew: '1.00',
        }),
      ],
    });

    expect(summary.activities[0].durationMonths).toBe(18);
    expect(summary.activities[1].durationMonths).toBe(28);
  });
});

describe('Ancoragem em calendário civil e fator de calendário (delta cronograma)', () => {
  it('composição multiplicativa: nominal 10 × chuva 0,85 × calendário 20/22 ≈ 7,73', () => {
    // Junho de 2026 tem 22 dias úteis (sáb/dom não laborais); 2 feriados em
    // dias laborais derivam 20 dias úteis -> fator 20/22.
    const params = customRainfall([
      '10',
      '10',
      '10',
      '10',
      '10',
      '150',
      '10',
      '10',
      '10',
      '10',
      '10',
      '10',
    ]);
    const calendar: WorkCalendarParameters = {
      standardWorkingDaysPerMonth: '22.00',
      nonWorkingWeekdays: [0, 6],
      holidays: [
        { date: '2026-06-10', name: 'Feriado A', recurring: false, uf: null },
        { date: '2026-06-11', name: 'Feriado B', recurring: false, uf: null },
      ],
    };

    const summary = calculate({
      scheduleStartDate: '2026-06-01',
      rainfallParameters: params,
      workCalendar: calendar,
    });

    const firstMonth = summary.activities[0].monthlyBreakdown?.[0];
    expect(firstMonth?.civilYear).toBe(2026);
    expect(firstMonth?.civilMonth).toBe(6);
    expect(firstMonth?.rainfallFactor).toBe('0.8500');
    expect(firstMonth?.calendarFactor).toBe('0.9091');
    expect(firstMonth?.effectiveProduction).toBe('7.73');
  });

  it('mês 4 do projeto ancorado em 2027-03-15 resolve o mês civil junho de 2027', () => {
    const params = customRainfall(Array(12).fill('10'));

    const summary = calculate({
      scheduleStartDate: '2027-03-15',
      rainfallParameters: params,
      activities: [baseActivity({ startMonth: 4, totalQuantity: '10.00' })],
    });

    const firstMonth = summary.activities[0].monthlyBreakdown?.[0];
    expect(firstMonth?.projectMonth).toBe(4);
    expect(firstMonth?.civilYear).toBe(2027);
    expect(firstMonth?.civilMonth).toBe(6);
    expect(summary.scheduleStartDate).toBe('2027-03-15');
  });

  it('ausência de data de início gera pendência explícita e cálculo sem fator de calendário (RNF-09)', () => {
    const summary = calculate();

    expect(
      summary.warnings.some((w) =>
        w.includes(
          'Data de início do cronograma não informada: feriados e dias não laborais não foram considerados',
        ),
      ),
    ).toBe(true);
    expect(summary.scheduleStartDate).toBeUndefined();
    const firstMonth = summary.activities[0].monthlyBreakdown?.[0];
    expect(firstMonth?.civilYear).toBeUndefined();
    expect(firstMonth?.calendarFactor).toBe('1.0000');
  });

  it('data de início com calendário inexistente (2027-02-30) é pendência, nunca rollover silencioso', () => {
    const summary = calculate({ scheduleStartDate: '2027-02-30' });

    expect(
      summary.warnings.some((w) =>
        w.includes("Data de início do cronograma inválida ('2027-02-30')"),
      ),
    ).toBe(true);
    expect(summary.scheduleStartDate).toBeUndefined();
  });
});
