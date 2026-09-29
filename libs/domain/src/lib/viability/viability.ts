/**
 * Contratos do módulo M13 — viabilidade do lote para o licitante (RNF-05,
 * RNF-08, RNF-09): parâmetros regulatório-financeiros versionados por
 * vigência e o parecer derivado em termos reais ao WACC regulatório.
 */

import { AuctionBenchmark } from '../auction-history/auction-history';

/** Parâmetros vigentes usados no parecer (decimais como string — RNF-08). */
export interface ViabilityParameters {
  effectiveFrom: string; // AAAA-MM-DD
  waccRealAfterTaxPercent: string;
  concessionYears: number;
  pisCofinsPercent: string;
  operationMaintenancePercent: string;
  incomeTaxPercent: string;
}

export interface ViabilityParametersVersionItem extends ViabilityParameters {
  id: number;
  createdBy: string;
  createdAt: string; // ISO 8601
}

/** Origem do investimento base do parecer. */
export const VIABILITY_INVESTMENT_SOURCES = [
  'BIDDER',
  'ANEEL_ESTIMATE',
] as const;
export type ViabilityInvestmentSource =
  (typeof VIABILITY_INVESTMENT_SOURCES)[number];

/** Entradas faltantes tipadas — mensagens pt-BR ficam nas bordas. */
export const VIABILITY_MISSING_INPUTS = [
  'INVESTMENT',
  'MAX_RAP',
  'ESTIMATED_WINNING_RAP',
] as const;
export type ViabilityMissingInput = (typeof VIABILITY_MISSING_INPUTS)[number];

/** Entradas da revisão para o parecer (todas anuláveis — RNF-09). */
export interface ViabilityInputs {
  bidderCapex?: string | null;
  estimatedCapex?: string | null;
  maxRap?: string | null;
  winningRap?: string | null;
}

/** Parecer de viabilidade do lote (M13), derivado em leitura. */
export interface ViabilityAssessment {
  investmentBase: string | null;
  investmentSource: ViabilityInvestmentSource | null;
  investmentAnnuity: string | null;
  minimumGrossRap: string | null;
  maxSupportableDiscountPercent: string | null;
  /** Deságio derivado da RAP vencedora estimada (mesma regra da oferta). */
  estimatedDiscountPercent: string | null;
  /** RAP máxima do edital cobre a RAP mínima (deságio máximo ≥ 0). */
  viableAtMaxRap: boolean | null;
  /** RAP vencedora estimada cobre a RAP mínima. */
  viableAtEstimatedRap: boolean | null;
  /** Folga (positiva) ou excesso (negativo) do deságio pretendido frente ao
   *  máximo suportado, em pontos percentuais. */
  discountMarginPoints: string | null;
  missingInputs: ViabilityMissingInput[];
}

/** Resposta completa do endpoint de avaliação. */
export interface ViabilityAssessmentResponse {
  assessment: ViabilityAssessment;
  parameters: ViabilityParametersVersionItem;
  auctionStats: AuctionBenchmark | null;
  overallStats: AuctionBenchmark;
}
