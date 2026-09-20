import {
  PrecipitationCalculator,
  UF_METADATA_MAP,
} from './precipitation-calculator';

describe('PrecipitationCalculator (27 UFs & RN-16 Calibration)', () => {
  it('should cover all 27 Brazilian UFs without omissions', () => {
    const allUfs = PrecipitationCalculator.getAllUfData();
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
      expect(PrecipitationCalculator.isKnownUf(uf)).toBe(true);
    }
  });

  it('should return complete 12 months data with valid regions for each UF', () => {
    const paData = PrecipitationCalculator.getUfPrecipitationSeries('PA');
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

  it('should classify precipitation severity levels correctly per RN-16', () => {
    expect(PrecipitationCalculator.classifyLevel(20)).toBe(1); // < 50mm
    expect(PrecipitationCalculator.classifyLevel(80)).toBe(2); // 50-100mm
    expect(PrecipitationCalculator.classifyLevel(150)).toBe(3); // 100-200mm
    expect(PrecipitationCalculator.classifyLevel(250)).toBe(4); // 200-300mm
    expect(PrecipitationCalculator.classifyLevel(350)).toBe(5); // > 300mm
  });

  it('should calculate effective production adjusted by precipitation', () => {
    // Para MG no mês 1 (Janeiro = 280mm -> Nível 4 -> Fator 0.75)
    // Produção nominal 20 -> 20 * 0.75 = 15.00
    const effProd = PrecipitationCalculator.calculateEffectiveProduction(
      20,
      'MG',
      1,
    );
    expect(effProd.toFixed(2)).toBe('15.00');
  });

  it('should calculate average productivity factor over a duration period', () => {
    const avgFactor = PrecipitationCalculator.getAverageProductivityFactor(
      'MG',
      1,
      6,
    );
    expect(avgFactor.toNumber()).toBeGreaterThan(0.7);
    expect(avgFactor.toNumber()).toBeLessThanOrEqual(1.0);
  });
});
