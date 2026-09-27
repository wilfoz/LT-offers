import {
  BRAZILIAN_UFS,
  DEFAULT_RAINFALL_PARAMETERS,
  DEFAULT_RAINFALL_SEVERITY_BANDS,
  RainfallParameters,
  classifyRainfallBand,
  validateRainfallParameters,
} from './rainfall-parameters';

describe('Parâmetros de chuva — contratos e validação (RN-16, RF-37)', () => {
  describe('defaults da planilha (seed e testes golden)', () => {
    it('deve prover as 5 faixas originais com fatores 1,00 / 0,95 / 0,85 / 0,75 / 0,65', () => {
      expect(
        DEFAULT_RAINFALL_SEVERITY_BANDS.map((b) => b.productivityFactor),
      ).toEqual(['1.00', '0.95', '0.85', '0.75', '0.65']);
      expect(DEFAULT_RAINFALL_SEVERITY_BANDS[4].upperLimitMm).toBeNull();
    });

    it('deve cobrir as 27 UFs com 12 meses cada', () => {
      expect(DEFAULT_RAINFALL_PARAMETERS.ufSeries).toHaveLength(27);
      for (const series of DEFAULT_RAINFALL_PARAMETERS.ufSeries) {
        expect(series.monthlyMm).toHaveLength(12);
      }
    });

    it('deve reproduzir a série original de MG da planilha', () => {
      const mg = DEFAULT_RAINFALL_PARAMETERS.ufSeries.find(
        (s) => s.uf === 'MG',
      );
      expect(mg?.monthlyMm).toEqual([
        '280',
        '210',
        '160',
        '65',
        '30',
        '15',
        '10',
        '15',
        '50',
        '120',
        '210',
        '310',
      ]);
    });

    it('defaults devem passar na validação estrutural sem violações', () => {
      expect(validateRainfallParameters(DEFAULT_RAINFALL_PARAMETERS)).toEqual(
        [],
      );
    });
  });

  describe('classifyRainfallBand — fronteiras reproduzem a classificação histórica', () => {
    const bands = DEFAULT_RAINFALL_SEVERITY_BANDS;

    it.each([
      [30, 1],
      [49.9, 1],
      [50, 2],
      [100, 2],
      [150, 3],
      [200, 3],
      [250, 4],
      [300, 4],
      [310, 5],
      [420, 5],
    ])('%s mm classifica na faixa %s', (mm, expectedPosition) => {
      expect(classifyRainfallBand(mm as number, bands).position).toBe(
        expectedPosition,
      );
    });

    it('deve refletir fator editado pelo usuário na classificação', () => {
      const edited = bands.map((b) =>
        b.position === 5 ? { ...b, productivityFactor: '0.80' } : b,
      );
      expect(classifyRainfallBand(350, edited).productivityFactor).toBe('0.80');
    });
  });

  describe('validateRainfallParameters — violações tipadas', () => {
    const validParams = (): RainfallParameters => ({
      bands: DEFAULT_RAINFALL_SEVERITY_BANDS.map((b) => ({ ...b })),
      ufSeries: DEFAULT_RAINFALL_PARAMETERS.ufSeries.map((s) => ({
        uf: s.uf,
        monthlyMm: [...s.monthlyMm],
      })),
    });

    it('deve rejeitar fator de produtividade acima de 1', () => {
      const params = validParams();
      params.bands[0].productivityFactor = '1.20';
      expect(validateRainfallParameters(params)).toContainEqual({
        code: 'band-factor-out-of-range',
        position: 1,
      });
    });

    it('deve rejeitar fator que não é decimal válido (negativo ou texto)', () => {
      const params = validParams();
      params.bands[1].productivityFactor = '-0.5';
      expect(validateRainfallParameters(params)).toContainEqual({
        code: 'band-factor-invalid',
        position: 2,
      });
    });

    it('deve apontar a UF ausente na matriz, sem assumir zero (RNF-09)', () => {
      const params = validParams();
      params.ufSeries = params.ufSeries.filter((s) => s.uf !== 'BA');
      expect(validateRainfallParameters(params)).toEqual([
        { code: 'uf-missing', uf: 'BA' },
      ]);
    });

    it('deve rejeitar série com quantidade de meses diferente de 12', () => {
      const params = validParams();
      params.ufSeries[0].monthlyMm.pop();
      expect(validateRainfallParameters(params)).toContainEqual({
        code: 'uf-series-length-invalid',
        uf: params.ufSeries[0].uf,
      });
    });

    it('deve rejeitar precipitação negativa identificando UF e mês', () => {
      const params = validParams();
      params.ufSeries[2].monthlyMm[4] = '-10';
      expect(validateRainfallParameters(params)).toContainEqual({
        code: 'precipitation-invalid',
        uf: params.ufSeries[2].uf,
        month: 5,
      });
    });

    it('deve rejeitar posição de faixa duplicada', () => {
      const params = validParams();
      params.bands[1].position = 1;
      expect(validateRainfallParameters(params)).toContainEqual({
        code: 'band-position-duplicated',
        position: 1,
      });
    });

    it('deve rejeitar limites de faixa não estritamente crescentes', () => {
      const params = validParams();
      params.bands[2].upperLimitMm = '80';
      expect(validateRainfallParameters(params)).toContainEqual({
        code: 'band-limits-not-increasing',
        position: 3,
      });
    });

    it('deve exigir a última faixa aberta e faixa aberta apenas no fim', () => {
      const params = validParams();
      params.bands[1].upperLimitMm = null;
      params.bands[4].upperLimitMm = '400';
      const violations = validateRainfallParameters(params);
      expect(violations).toContainEqual({
        code: 'band-open-not-last',
        position: 2,
      });
      expect(violations).toContainEqual({ code: 'last-band-not-open' });
    });

    it('deve rejeitar UF desconhecida e UF duplicada', () => {
      const params = validParams();
      params.ufSeries.push({
        uf: 'XX',
        monthlyMm: params.ufSeries[0].monthlyMm,
      });
      params.ufSeries.push({
        uf: 'MG',
        monthlyMm: params.ufSeries[0].monthlyMm,
      });
      const violations = validateRainfallParameters(params);
      expect(violations).toContainEqual({ code: 'uf-unknown', uf: 'XX' });
      expect(violations).toContainEqual({ code: 'uf-duplicated', uf: 'MG' });
    });

    it('lista canônica deve conter exatamente 27 UFs', () => {
      expect(BRAZILIAN_UFS).toHaveLength(27);
      expect(new Set(BRAZILIAN_UFS).size).toBe(27);
    });
  });
});
