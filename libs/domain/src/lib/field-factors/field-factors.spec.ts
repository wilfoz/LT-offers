import {
  ACCESS_SEVERITY_WEIGHTS,
  DEFAULT_GEOTECHNICAL_FACTORS,
  calculateWeightedAccessFactor,
} from './field-factors.types';

describe('Field Factors & Engineering Calibrations Domain', () => {
  it('should have standard access severity weights', () => {
    expect(ACCESS_SEVERITY_WEIGHTS.NORMAL).toBe(1.0);
    expect(ACCESS_SEVERITY_WEIGHTS.DIFFICULT).toBe(1.25);
    expect(ACCESS_SEVERITY_WEIGHTS.CROSSING).toBe(1.6);
  });

  it('should calculate weighted access factor accurately', () => {
    const distribution = [
      { difficulty: 'NORMAL' as const, count: 70 },
      { difficulty: 'DIFFICULT' as const, count: 20 },
      { difficulty: 'CROSSING' as const, count: 10 },
    ];
    // 70 * 1.0 + 20 * 1.25 + 10 * 1.60 = 70 + 25 + 16 = 111 / 100 = 1.11
    const factor = calculateWeightedAccessFactor(distribution);
    expect(factor).toBe(1.11);
  });

  it('should return 1.0 for empty distribution', () => {
    expect(calculateWeightedAccessFactor([])).toBe(1.0);
  });

  it('should define default geotechnical factors for normal and rock soils', () => {
    expect(DEFAULT_GEOTECHNICAL_FACTORS.NORMAL.soilExpansionFactor).toBe(0.25);
    expect(DEFAULT_GEOTECHNICAL_FACTORS.NORMAL.compactionFactor).toBe(0.15);
    expect(DEFAULT_GEOTECHNICAL_FACTORS.HARD_ROCK.soilExpansionFactor).toBe(
      0.4,
    );
  });
});
