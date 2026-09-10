import {
  TAX_REGIMES,
  TAX_REGIME_LABELS,
  DIFAL_METHODS,
  IcmsRule,
  IpiRule,
  PisCofinsRule,
} from './';

describe('Tax Rules Domain Contracts (RF-32, RN-04, RN-05, RN-06)', () => {
  it('deve possuir regimes tributários STANDARD, REIDI e DIRECT_BILLING', () => {
    expect(TAX_REGIMES).toEqual(['STANDARD', 'REIDI', 'DIRECT_BILLING']);
    expect(TAX_REGIME_LABELS.REIDI).toContain('Suspensão de PIS/COFINS');
    expect(TAX_REGIME_LABELS.DIRECT_BILLING).toContain('Direct Billing');
  });

  it('deve possuir métodos de DIFAL por base simples e base dupla', () => {
    expect(DIFAL_METHODS).toEqual(['SINGLE_BASE', 'DOUBLE_BASE']);
  });

  it('deve instanciar uma regra de ICMS interestadual com base dupla', () => {
    const icms: IcmsRule = {
      originState: 'SP',
      destinationState: 'MG',
      interstateRatePercent: 7.0,
      internalDestinationRatePercent: 18.0,
      fecoepRatePercent: 2.0,
      difalMethod: 'DOUBLE_BASE',
      isImportedProduct: false,
    };
    expect(icms.difalMethod).toBe('DOUBLE_BASE');
    expect(icms.interstateRatePercent).toBe(7.0);
  });

  it('deve instanciar uma regra de IPI e PIS/COFINS', () => {
    const ipi: IpiRule = {
      ncmCode: '7308.20.00',
      description: 'Torres e pórticos de ferro fundido, ferro ou aço',
      ratePercent: 3.25,
    };
    const pisCofins: PisCofinsRule = {
      regime: 'REIDI',
      pisRatePercent: 0,
      cofinsRatePercent: 0,
    };
    expect(ipi.ratePercent).toBe(3.25);
    expect(pisCofins.pisRatePercent).toBe(0);
  });
});
