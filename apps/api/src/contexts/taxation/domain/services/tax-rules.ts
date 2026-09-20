import { IcmsRule, PisCofinsRule, TaxRegime } from '@lt-offers/domain';
import { UfStateTaxProfile } from '../entities/uf-state-tax-profile';

const SOUTH_SOUTHEAST_ORIGINS = ['SP', 'RJ', 'MG', 'PR', 'SC', 'RS'];

/**
 * Constrói a matriz completa de regras de ICMS interestadual (RN-01, RN-05):
 * operação interna usa a alíquota interna do destino; Sul/Sudeste (exceto ES)
 * para N/NE/CO/ES aplica 7%; demais pares interestaduais aplicam 12%.
 */
export function buildIcmsRulesMap(
  states: UfStateTaxProfile[],
): Record<string, IcmsRule> {
  const rules: Record<string, IcmsRule> = {};

  for (const origin of states) {
    for (const dest of states) {
      const key = `${origin.code}->${dest.code}`;
      const isInternal = origin.code === dest.code;

      let interstateRate = 12.0;
      if (isInternal) {
        interstateRate = dest.internalRate;
      } else if (
        SOUTH_SOUTHEAST_ORIGINS.includes(origin.code) &&
        !SOUTH_SOUTHEAST_ORIGINS.includes(dest.code)
      ) {
        interstateRate = 7.0;
      } else {
        interstateRate = 12.0;
      }

      rules[key] = {
        originState: origin.code,
        destinationState: dest.code,
        interstateRatePercent: interstateRate,
        internalDestinationRatePercent: dest.internalRate,
        fecoepRatePercent: dest.fecoepRate,
        difalMethod: dest.difalMethod,
      };
    }
  }

  return rules;
}

/**
 * Regra de PIS/COFINS por regime (RN-04): REIDI e faturamento direto zeram
 * as alíquotas; o regime padrão usa 1,65% / 7,6%.
 */
export function resolvePisCofinsRule(regime: TaxRegime): PisCofinsRule {
  if (regime === 'REIDI' || regime === 'DIRECT_BILLING') {
    return {
      regime,
      pisRatePercent: 0.0,
      cofinsRatePercent: 0.0,
    };
  }
  return {
    regime: 'STANDARD',
    pisRatePercent: 1.65,
    cofinsRatePercent: 7.6,
  };
}
