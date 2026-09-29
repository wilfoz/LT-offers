import { ViabilityParameters } from './viability';
import {
  assessViability,
  capitalRecoveryFactor,
  investmentAnnuity,
  maxSupportableDiscount,
  minimumGrossRap,
} from './viability-derivations';

/** Parâmetros do seed (WACC 2026, fatores marcados como hipótese). */
const seedParameters: ViabilityParameters = {
  effectiveFrom: '2026-03-01',
  waccRealAfterTaxPercent: '8.00',
  concessionYears: 30,
  pisCofinsPercent: '9.25',
  operationMaintenancePercent: '10.00',
  incomeTaxPercent: '10.00',
};

describe('Derivações de viabilidade do lote (M13, RNF-08, RNF-09)', () => {
  describe('capitalRecoveryFactor', () => {
    it('calcula o fator para 8% e 30 anos (≈ 0.0888274)', () => {
      const factor = capitalRecoveryFactor('8.00', 30);
      expect(factor?.toFixed(7)).toBe('0.0888274');
    });

    it.each([
      [null, 30],
      ['0', 30],
      ['abc', 30],
      ['8.00', null],
      ['8.00', 0],
      ['8.00', 1.5],
    ])('entrada inválida (%s, %s) vira null', (wacc, years) => {
      expect(
        capitalRecoveryFactor(wacc as string | null, years as number | null),
      ).toBeNull();
    });
  });

  describe('investmentAnnuity — valores canônicos do spec', () => {
    it('CAPEX 4,11 bi a 8% em 30 anos deriva anuidade 365080751.22', () => {
      expect(investmentAnnuity('4110000000.00', '8.00', 30)).toBe(
        '365080751.22',
      );
    });

    it('entrada ausente vira null, nunca zero', () => {
      expect(investmentAnnuity(null, '8.00', 30)).toBeNull();
      expect(investmentAnnuity('4110000000.00', null, 30)).toBeNull();
    });
  });

  describe('minimumGrossRap — reversão dos fatores de dedução', () => {
    const deductions = {
      pisCofinsPercent: '9.25',
      operationMaintenancePercent: '10.00',
      incomeTaxPercent: '10.00',
    };

    it('anuidade canônica com fatores 9,25/10/10 deriva 496657825.69', () => {
      expect(minimumGrossRap('365080751.22', deductions)).toBe('496657825.69');
    });

    it('fator de dedução de 100% ou mais vira null (divisão inviável)', () => {
      expect(
        minimumGrossRap('365080751.22', {
          ...deductions,
          pisCofinsPercent: '100.00',
        }),
      ).toBeNull();
      expect(
        minimumGrossRap('365080751.22', {
          ...deductions,
          operationMaintenancePercent: '110.00',
        }),
      ).toBeNull();
    });

    it('fatores zerados devolvem a própria anuidade', () => {
      expect(
        minimumGrossRap('100.00', {
          pisCofinsPercent: '0',
          operationMaintenancePercent: '0',
          incomeTaxPercent: '0',
        }),
      ).toBe('100.00');
    });
  });

  describe('maxSupportableDiscount', () => {
    it('RAP mínima canônica sobre RAP máxima 762,63 mi deriva 34.88', () => {
      expect(maxSupportableDiscount('496657825.69', '762630000.00')).toBe(
        '34.88',
      );
    });

    it('RAP mínima acima do teto deriva deságio negativo (inviável)', () => {
      expect(maxSupportableDiscount('800000000.00', '762630000.00')).toBe(
        '-4.90',
      );
    });

    it('RAP máxima ausente ou zero vira null', () => {
      expect(maxSupportableDiscount('496657825.69', null)).toBeNull();
      expect(maxSupportableDiscount('496657825.69', '0')).toBeNull();
    });
  });

  describe('assessViability — parecer completo', () => {
    const fullInputs = {
      bidderCapex: '4110000000.00',
      estimatedCapex: '3900000000.00',
      maxRap: '762630000.00',
      winningRap: '600000000.00',
    };

    it('investimento do licitante prevalece com origem BIDDER e vereditos derivados', () => {
      const assessment = assessViability(fullInputs, seedParameters);
      expect(assessment).toEqual({
        investmentBase: '4110000000.00',
        investmentSource: 'BIDDER',
        investmentAnnuity: '365080751.22',
        minimumGrossRap: '496657825.69',
        maxSupportableDiscountPercent: '34.88',
        estimatedDiscountPercent: '21.32', // 1 − 600/762.63 = 21,32%
        viableAtMaxRap: true,
        viableAtEstimatedRap: true, // 600 mi ≥ 496,66 mi
        discountMarginPoints: '13.56', // 34.88 − 21.32
        missingInputs: [],
      });
    });

    it('sem investimento do licitante recua ao CAPEX ANEEL com origem identificada', () => {
      const assessment = assessViability(
        { ...fullInputs, bidderCapex: null },
        seedParameters,
      );
      expect(assessment.investmentBase).toBe('3900000000.00');
      expect(assessment.investmentSource).toBe('ANEEL_ESTIMATE');
      expect(assessment.missingInputs).toEqual([]);
    });

    it('investimento do licitante malformado equivale a ausente e recua ao CAPEX ANEEL', () => {
      const assessment = assessViability(
        { ...fullInputs, bidderCapex: 'abc' },
        seedParameters,
      );
      expect(assessment.investmentBase).toBe('3900000000.00');
      expect(assessment.investmentSource).toBe('ANEEL_ESTIMATE');
    });

    it('RAP vencedora estimada abaixo da mínima reprova o veredito com excesso em pontos', () => {
      const assessment = assessViability(
        { ...fullInputs, winningRap: '400000000.00' },
        seedParameters,
      );
      // Deságio pretendido 47,55% > máximo suportado 34,88%.
      expect(assessment.viableAtEstimatedRap).toBe(false);
      expect(assessment.estimatedDiscountPercent).toBe('47.55');
      expect(assessment.discountMarginPoints).toBe('-12.67');
    });

    it('sem investimento e sem RAPs, tudo null com missingInputs completo (RNF-09)', () => {
      const assessment = assessViability({}, seedParameters);
      expect(assessment).toEqual({
        investmentBase: null,
        investmentSource: null,
        investmentAnnuity: null,
        minimumGrossRap: null,
        maxSupportableDiscountPercent: null,
        estimatedDiscountPercent: null,
        viableAtMaxRap: null,
        viableAtEstimatedRap: null,
        discountMarginPoints: null,
        missingInputs: ['INVESTMENT', 'MAX_RAP', 'ESTIMATED_WINNING_RAP'],
      });
    });

    it('RAP mínima acima do teto sinaliza inviável no edital', () => {
      const assessment = assessViability(
        { bidderCapex: '9000000000.00', maxRap: '762630000.00' },
        seedParameters,
      );
      expect(assessment.viableAtMaxRap).toBe(false);
      expect(assessment.maxSupportableDiscountPercent?.startsWith('-')).toBe(
        true,
      );
      // Sem RAP vencedora estimada, a margem em pontos fica não informada
      // mesmo com o deságio máximo presente (RNF-09).
      expect(assessment.discountMarginPoints).toBeNull();
      expect(assessment.missingInputs).toEqual(['ESTIMATED_WINNING_RAP']);
    });
  });
});
