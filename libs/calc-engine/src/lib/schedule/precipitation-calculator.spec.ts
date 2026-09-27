import { DEFAULT_RAINFALL_PARAMETERS } from '@lt-offers/domain';
import { PrecipitationCalculator } from './precipitation-calculator';

const params = DEFAULT_RAINFALL_PARAMETERS;

describe('PrecipitationCalculator — parâmetros vigentes injetados (27 UFs, RN-16)', () => {
  it('deve cobrir as 27 UFs brasileiras sem omissões', () => {
    const allUfs = PrecipitationCalculator.getAllUfData(params);
    expect(allUfs.length).toBe(27);

    const ufCodes = allUfs.map((u) => u.uf);
    const expectedUfs = [
      'AC',
      'AL',
      'AP',
      'AM',
      'BA',
      'CE',
      'DF',
      'ES',
      'GO',
      'MA',
      'MT',
      'MS',
      'MG',
      'PA',
      'PB',
      'PR',
      'PE',
      'PI',
      'RJ',
      'RN',
      'RS',
      'RO',
      'RR',
      'SC',
      'SP',
      'SE',
      'TO',
    ];

    for (const uf of expectedUfs) {
      expect(ufCodes).toContain(uf);
      expect(PrecipitationCalculator.isKnownUf(uf, params)).toBe(true);
    }
  });

  it('deve retornar os 12 meses completos com região válida por UF', () => {
    const paData = PrecipitationCalculator.getUfPrecipitationSeries(
      'PA',
      params,
    );
    expect(paData.uf).toBe('PA');
    expect(paData.name).toBe('Pará');
    expect(paData.region).toBe('NORTE');
    expect(paData.monthlyData.length).toBe(12);

    for (let m = 1; m <= 12; m++) {
      const monthData = paData.monthlyData[m - 1];
      expect(monthData.month).toBe(m);
      expect(monthData.averageMm).toBeGreaterThan(0);
      expect(monthData.severityLevel).toBeGreaterThanOrEqual(1);
      expect(monthData.severityLevel).toBeLessThanOrEqual(5);
      expect(monthData.productivityFactor).toBeGreaterThanOrEqual(0.55);
      expect(monthData.productivityFactor).toBeLessThanOrEqual(1.0);
    }
  });

  it('UF fora da matriz vigente é erro explícito, nunca fallback silencioso (RNF-09)', () => {
    expect(PrecipitationCalculator.isKnownUf('XX', params)).toBe(false);
    expect(() =>
      PrecipitationCalculator.getUfPrecipitationSeries('XX', params),
    ).toThrow("UF 'XX' não encontrada na matriz de precipitação vigente.");
    expect(() =>
      PrecipitationCalculator.getPrecipitationForUfAndMonth('XX', 1, params),
    ).toThrow("UF 'XX' não encontrada na matriz de precipitação vigente.");
  });

  it('deve classificar a severidade nas faixas vigentes preservando as fronteiras históricas (RN-16)', () => {
    expect(PrecipitationCalculator.classifyBand(20, params).position).toBe(1);
    expect(PrecipitationCalculator.classifyBand(80, params).position).toBe(2);
    expect(PrecipitationCalculator.classifyBand(100, params).position).toBe(2);
    expect(PrecipitationCalculator.classifyBand(150, params).position).toBe(3);
    expect(PrecipitationCalculator.classifyBand(250, params).position).toBe(4);
    expect(PrecipitationCalculator.classifyBand(300, params).position).toBe(4);
    expect(PrecipitationCalculator.classifyBand(350, params).position).toBe(5);
  });

  it('deve retornar o fator de produtividade da faixa pela posição', () => {
    expect(
      PrecipitationCalculator.getProductivityFactor(1, params).toText(),
    ).toBe('1');
    expect(
      PrecipitationCalculator.getProductivityFactor(5, params).toText(),
    ).toBe('0.65');
    expect(() =>
      PrecipitationCalculator.getProductivityFactor(9, params),
    ).toThrow(
      'Faixa de severidade de posição 9 não existe nos parâmetros de chuva vigentes.',
    );
  });

  it('deve calcular a produção efetiva ajustada pela chuva do mês', () => {
    // MG em Janeiro = 280 mm -> faixa 4 -> fator 0.75; 20 * 0.75 = 15.00
    const effProd = PrecipitationCalculator.calculateEffectiveProduction(
      20,
      'MG',
      1,
      params,
    );
    expect(effProd.toFixed(2)).toBe('15.00');
  });

  it('fator editado pelo usuário reflete na produção efetiva (percentuais configuráveis)', () => {
    const edited = {
      ...params,
      bands: params.bands.map((b) =>
        b.position === 4 ? { ...b, productivityFactor: '0.80' } : b,
      ),
    };
    // MG em Janeiro = 280 mm -> faixa 4 agora com fator 0.80; 20 * 0.80 = 16.00
    const effProd = PrecipitationCalculator.calculateEffectiveProduction(
      20,
      'MG',
      1,
      edited,
    );
    expect(effProd.toFixed(2)).toBe('16.00');
  });

  it('deve calcular o fator médio de produtividade de um período (método legado)', () => {
    const avgFactor = PrecipitationCalculator.getAverageProductivityFactor(
      'MG',
      1,
      6,
      params,
    );
    expect(avgFactor.toNumber()).toBeGreaterThan(0.7);
    expect(avgFactor.toNumber()).toBeLessThanOrEqual(1.0);
  });
});
