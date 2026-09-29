/**
 * Derivações puras da viabilidade do lote (M13, RNF-08, RNF-09) em TERMOS
 * REAIS: RAP constante descontada ao WACC regulatório real após impostos,
 * sem projeção de inflação (decisão do usuário em 29/09/2026). Ausência ou
 * invalidez de entrada vira null — nunca zero silencioso.
 */

import { Decimal } from 'decimal.js';
import { POSITIVE_DECIMAL_PATTERN } from '../catalogs/validation';
import { discountPercent } from '../offers/offer-derivations';
import {
  ViabilityAssessment,
  ViabilityInputs,
  ViabilityMissingInput,
  ViabilityParameters,
} from './viability';

// Precisão interna alta para a potência (1+i)^n; as saídas monetárias e
// percentuais são arredondadas a 2 casas half-up apenas no final.
const HighPrecision = Decimal.clone({ precision: 40 });

function decimalOrNull(value: string | null | undefined): Decimal | null {
  if (value == null || !POSITIVE_DECIMAL_PATTERN.test(value)) return null;
  return new HighPrecision(value);
}

/** Devolve a própria string quando é decimal válido; senão null. */
function validDecimalStringOrNull(
  value: string | null | undefined,
): string | null {
  return decimalOrNull(value) === null ? null : (value as string);
}

/** Fatores de dedução da RAP bruta usados na reversão multiplicativa. */
export type ViabilityDeductions = Pick<
  ViabilityParameters,
  'pisCofinsPercent' | 'operationMaintenancePercent' | 'incomeTaxPercent'
>;

/**
 * Fator de recuperação de capital i(1+i)^n / ((1+i)^n − 1), com i = WACC
 * real após impostos (% a.a.) e n = prazo em anos. Null para WACC não
 * positivo ou prazo não inteiro positivo.
 */
export function capitalRecoveryFactor(
  waccPercent: string | null | undefined,
  years: number | null | undefined,
): Decimal | null {
  const wacc = decimalOrNull(waccPercent);
  if (
    wacc === null ||
    wacc.isZero() ||
    years == null ||
    !Number.isInteger(years) ||
    years < 1
  ) {
    return null;
  }
  const i = wacc.dividedBy(100);
  const compound = i.plus(1).pow(years);
  return i.times(compound).dividedBy(compound.minus(1));
}

/**
 * Anuidade do investimento: CAPEX × fator de recuperação de capital,
 * duas casas half-up. Null quando falta entrada.
 */
export function investmentAnnuity(
  capex: string | null | undefined,
  waccPercent: string | null | undefined,
  years: number | null | undefined,
): string | null {
  const base = decimalOrNull(capex);
  const factor = capitalRecoveryFactor(waccPercent, years);
  if (base === null || factor === null) return null;
  return base.times(factor).toFixed(2);
}

/**
 * RAP bruta mínima: anuidade ÷ [(1 − PIS/COFINS)(1 − O&M)(1 − IR/CSLL)].
 * Null quando falta entrada ou algum fator de dedução é ≥ 100%.
 */
export function minimumGrossRap(
  annuity: string | null | undefined,
  deductions: ViabilityDeductions,
): string | null {
  const base = decimalOrNull(annuity);
  if (base === null) return null;

  let net = new HighPrecision(1);
  for (const percent of [
    deductions.pisCofinsPercent,
    deductions.operationMaintenancePercent,
    deductions.incomeTaxPercent,
  ]) {
    const factor = decimalOrNull(percent);
    if (factor === null) return null;
    const remaining = new HighPrecision(1).minus(factor.dividedBy(100));
    if (remaining.lessThanOrEqualTo(0)) return null;
    net = net.times(remaining);
  }
  return base.dividedBy(net).toFixed(2);
}

/**
 * Deságio máximo suportado: (1 − RAP mínima ÷ RAP máxima) × 100, duas
 * casas half-up; negativo = lote inviável no teto do edital. Null quando
 * falta entrada ou a RAP máxima é zero.
 */
export function maxSupportableDiscount(
  minimumRap: string | null | undefined,
  maxRap: string | null | undefined,
): string | null {
  const minimum = decimalOrNull(minimumRap);
  const max = decimalOrNull(maxRap);
  if (minimum === null || max === null || max.isZero()) return null;
  return new HighPrecision(1)
    .minus(minimum.dividedBy(max))
    .times(100)
    .toFixed(2);
}

/**
 * Parecer completo: resolve o investimento base (licitante → estimativa
 * ANEEL, com origem), deriva anuidade/RAP mínima/deságio máximo e os
 * vereditos frente à RAP máxima e à RAP vencedora estimada. Ausências
 * propagam null e entram em missingInputs (RNF-09).
 */
/** Investimento base do parecer: licitante → estimativa ANEEL → ausente. */
function resolveInvestmentBase(inputs: ViabilityInputs): {
  investmentBase: string | null;
  investmentSource: ViabilityAssessment['investmentSource'];
} {
  const bidder = validDecimalStringOrNull(inputs.bidderCapex);
  if (bidder !== null) {
    return { investmentBase: bidder, investmentSource: 'BIDDER' };
  }
  const aneel = validDecimalStringOrNull(inputs.estimatedCapex);
  if (aneel !== null) {
    return { investmentBase: aneel, investmentSource: 'ANEEL_ESTIMATE' };
  }
  return { investmentBase: null, investmentSource: null };
}

export function assessViability(
  inputs: ViabilityInputs,
  parameters: ViabilityParameters,
): ViabilityAssessment {
  const { investmentBase, investmentSource } = resolveInvestmentBase(inputs);
  const missingInputs: ViabilityMissingInput[] = [];
  if (investmentBase === null) missingInputs.push('INVESTMENT');
  if (decimalOrNull(inputs.maxRap) === null) missingInputs.push('MAX_RAP');
  if (decimalOrNull(inputs.winningRap) === null) {
    missingInputs.push('ESTIMATED_WINNING_RAP');
  }

  const annuity = investmentAnnuity(
    investmentBase,
    parameters.waccRealAfterTaxPercent,
    parameters.concessionYears,
  );
  const minimumRap = minimumGrossRap(annuity, parameters);
  const maxDiscount = maxSupportableDiscount(minimumRap, inputs.maxRap);
  const estimatedDiscount = discountPercent(
    inputs.maxRap ?? null,
    inputs.winningRap ?? null,
  );

  const winning = decimalOrNull(inputs.winningRap);
  const minimum = minimumRap === null ? null : new HighPrecision(minimumRap);

  return {
    investmentBase,
    investmentSource,
    investmentAnnuity: annuity,
    minimumGrossRap: minimumRap,
    maxSupportableDiscountPercent: maxDiscount,
    estimatedDiscountPercent: estimatedDiscount,
    viableAtMaxRap:
      maxDiscount === null ? null : !new Decimal(maxDiscount).isNegative(),
    viableAtEstimatedRap:
      minimum === null || winning === null
        ? null
        : winning.greaterThanOrEqualTo(minimum),
    discountMarginPoints:
      maxDiscount === null || estimatedDiscount === null
        ? null
        : new Decimal(maxDiscount).minus(estimatedDiscount).toFixed(2),
    missingInputs,
  };
}
