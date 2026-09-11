import {
  PerformanceIndicatorsCalculator,
  LinePerformanceData,
} from './performance-indicators-calculator';

describe('PerformanceIndicatorsCalculator (RF-49, M09)', () => {
  it('should calculate ratios accurately for a single transmission line', () => {
    // Linha de 150 km, 375 torres, R$ 180.000.000 de preço de venda
    const line: LinePerformanceData = {
      lineId: 'lt-1',
      lineName: 'LT 500 kV Teste 150km',
      lengthKm: 150,
      towerCount: 375,
      totalSalePrice: 180000000,
      suppliesSalePrice: 110000000,
      servicesSalePrice: 70000000,
      totalConcreteVolumeM3: 18000,
      totalSteelWeightTons: 6750,
    };

    const res = PerformanceIndicatorsCalculator.calculateLine(line);

    // R$ 180M / 150 km = 1.200.000,00 R$/km
    expect(res.costPerKm).toBe('1200000.00');
    // R$ 180M / 375 torres = 480.000,00 R$/torre
    expect(res.costPerTower).toBe('480000.00');
    // Suprimentos: 110M / 150 km = 733.333,33
    expect(res.suppliesCostPerKm).toBe('733333.33');
    // Serviços: 70M / 150 km = 466.666,67
    expect(res.servicesCostPerKm).toBe('466666.67');
    // Densidade: 375 / 150 = 2.50 torres/km
    expect(res.structuresDensityPerKm).toBe('2.50');
    // Vão médio: 150*1000 / (375-1) = 150000 / 374 = 401.07 m
    expect(res.averageSpanMeters).toBe('401.07');
    // Concreto: 18.000 m³ / 150 km = 120.00 m³/km; 18.000 / 375 = 48.00 m³/torre
    expect(res.concretePerKm).toBe('120.00');
    expect(res.concretePerTower).toBe('48.00');
    // Aço: 6.750 t / 150 km = 45.00 t/km; 6.750 / 375 = 18.00 t/torre
    expect(res.steelPerKm).toBe('45.00');
    expect(res.steelPerTower).toBe('18.00');
  });

  it('should handle zero length or zero towers gracefully without divide-by-zero errors', () => {
    const emptyLine: LinePerformanceData = {
      lineId: 'lt-empty',
      lineName: 'LT Vazia',
      lengthKm: 0,
      towerCount: 0,
      totalSalePrice: 0,
    };

    const res = PerformanceIndicatorsCalculator.calculateLine(emptyLine);
    expect(res.costPerKm).toBe('0.00');
    expect(res.costPerTower).toBe('0.00');
    expect(res.structuresDensityPerKm).toBe('0.00');
    expect(res.averageSpanMeters).toBe('0.00');
  });

  it('should consolidate multiple lines into a summary with accurate weighted metrics', () => {
    const lines: LinePerformanceData[] = [
      {
        lineId: 'lt-1',
        lineName: 'LT Norte 100km',
        lengthKm: 100,
        towerCount: 250,
        totalSalePrice: 100000000,
        suppliesSalePrice: 60000000,
        servicesSalePrice: 40000000,
        totalConcreteVolumeM3: 10000,
        totalSteelWeightTons: 4000,
      },
      {
        lineId: 'lt-2',
        lineName: 'LT Sul 200km',
        lengthKm: 200,
        towerCount: 500,
        totalSalePrice: 200000000,
        suppliesSalePrice: 120000000,
        servicesSalePrice: 80000000,
        totalConcreteVolumeM3: 20000,
        totalSteelWeightTons: 8000,
      },
    ];

    const summary = PerformanceIndicatorsCalculator.calculateSummary({
      offerId: 'offer-benchmark',
      lines,
    });

    expect(summary.byLine).toHaveLength(2);
    expect(summary.consolidated.lengthKm).toBe('300.00');
    expect(summary.consolidated.towerCount).toBe(750);
    expect(summary.consolidated.costPerKm).toBe('1000000.00'); // 300M / 300 km
    expect(summary.consolidated.costPerTower).toBe('400000.00'); // 300M / 750 torres
    expect(summary.consolidated.structuresDensityPerKm).toBe('2.50');
  });
});
