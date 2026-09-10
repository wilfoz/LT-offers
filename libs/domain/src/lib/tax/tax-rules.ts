/**
 * Regimes tributários aplicáveis à compra de materiais de LT (RN-04, RF-32).
 */
export const TAX_REGIMES = ['STANDARD', 'REIDI', 'DIRECT_BILLING'] as const;
export type TaxRegime = (typeof TAX_REGIMES)[number];

export const TAX_REGIME_LABELS: Record<TaxRegime, string> = {
  STANDARD: 'Padrão (Sem Benefício Fiscal)',
  REIDI: 'REIDI (Suspensão de PIS/COFINS)',
  DIRECT_BILLING: 'Faturamento Direto ao Cliente (Direct Billing)',
};

/**
 * Método de cálculo do Diferencial de Alíquota (DIFAL) (RN-05, RF-32).
 * - SINGLE_BASE: Base Simples (diferença direta de alíquotas sobre a base original).
 * - DOUBLE_BASE: Base Dupla (recomposição da base de cálculo no estado de destino excluindo ICMS origem e inserindo ICMS interno/FECOEP).
 */
export const DIFAL_METHODS = ['SINGLE_BASE', 'DOUBLE_BASE'] as const;
export type DifalMethod = (typeof DIFAL_METHODS)[number];

/**
 * Regra de alíquota de ICMS para um par Origem -> Destino (RN-05, RF-33).
 */
export interface IcmsRule {
  originState: string; // UF de origem (ex.: 'SP', 'SC', 'MG')
  destinationState: string; // UF de destino da linha (ex.: 'MG', 'BA', 'PA')
  interstateRatePercent: number; // Alíquota interestadual (ex.: 7% ou 12% ou 4% para importado)
  internalDestinationRatePercent: number; // Alíquota interna do estado de destino (ex.: 18%, 19%, 20.5%)
  fecoepRatePercent: number; // Fundo de Combate à Pobreza adicional no destino (ex.: 0%, 1%, 2%)
  difalMethod: DifalMethod; // SINGLE_BASE ou DOUBLE_BASE
  isImportedProduct?: boolean; // Se produto importado (alíquota fixa de 4% interestadual)
}

/**
 * Regra de alíquota de IPI por NCM (RN-06, RF-33).
 */
export interface IpiRule {
  ncmCode: string; // Nomenclatura Comum do Mercosul (ex.: '7308.20.00' para torres, '7614.10.10' para cabos)
  description?: string;
  ratePercent: number; // Alíquota de IPI (ex.: 0%, 3.25%, 5%, 6.5%, 10%)
}

/**
 * Regra de PIS e COFINS (RN-04, RF-32).
 */
export interface PisCofinsRule {
  regime: TaxRegime;
  pisRatePercent: number; // ex.: 1.65% (não-cumulativo) ou 0.65% (cumulativo) ou 0% (REIDI)
  cofinsRatePercent: number; // ex.: 7.60% (não-cumulativo) ou 3.00% (cumulativo) ou 0% (REIDI)
}

/**
 * Rateio por Estado de Destino da Linha de Transmissão (RN-01, RN-05).
 */
export interface DestinationStateShare {
  state: string; // UF (ex.: 'MG', 'SP')
  sharePercent: number; // Percentual de rateio da LT neste estado (ex.: 70% e 30%)
}

/**
 * Parâmetros de entrada para apuração fiscal de um item de material (RF-32).
 */
export interface ItemTaxCalculationInput {
  itemCode: string;
  itemName: string;
  ncmCode?: string;
  netUnitPrice: number; // Preço unitário líquido da cotação vencedora
  quantity: number; // Quantidade total física a ser precificada
  originState: string; // UF de origem do fornecedor
  destinations: DestinationStateShare[]; // UFs de destino e rateios
  taxRegime: TaxRegime;
  customIpiRatePercent?: number; // Sobrescrita manual de IPI se houver
  isImportedProduct?: boolean; // Se produto importado (aplica 4% interestadual)
  isDirectBillingAccepted?: boolean; // Se o cliente aceita faturamento direto
}

/**
 * Memória de cálculo analítica de tributos de um item (RF-34, RN-05, RN-06).
 */
export interface ItemTaxBreakdown {
  itemCode: string;
  itemName: string;
  quantity: number;
  netUnitPrice: number; // Preço unitário líquido sem tributos
  netTotalAmount: number; // Valor total líquido = netUnitPrice * quantity

  // 1. IPI (calculado por fora sobre a base líquida)
  ipiRatePercent: number;
  ipiAmount: number;

  // 2. ICMS Origem & DIFAL / FECOEP por estado de destino
  originState: string;
  destinationBreakdowns: DestinationTaxBreakdown[];

  // 3. Totais consolidados de ICMS, DIFAL e FECOEP
  totalIcmsOriginAmount: number;
  totalDifalAmount: number;
  totalFecoepAmount: number;

  // 4. PIS / COFINS
  pisRatePercent: number;
  pisAmount: number;
  cofinsRatePercent: number;
  cofinsAmount: number;

  // 5. Totais finais do item
  totalTaxesAmount: number; // IPI + DIFAL + FECOEP + PIS + COFINS (+ ICMS se aplicável)
  grossTotalAmount: number; // Preço final total com todos os tributos
  grossUnitPrice: number; // Preço unitário final com tributos
  isDirectBilling: boolean; // Se segregado em faturamento direto
  reidiBenefitAmount: number; // Economia obtida pela suspensão do REIDI (PIS/COFINS desonerados)
}

/**
 * Detalhamento de ICMS e DIFAL para uma UF de destino específica (RN-05).
 */
export interface DestinationTaxBreakdown {
  destinationState: string;
  sharePercent: number; // Rateio proporcional da linha neste estado
  interstateRatePercent: number;
  internalRatePercent: number;
  fecoepRatePercent: number;
  difalMethod: DifalMethod;
  allocatedNetBase: number; // Base líquida proporcional da UF
  icmsOriginAmount: number;
  reconstitutedDestinationBase: number; // Base recalculada por dentro no caso de Base Dupla
  difalAmount: number;
  fecoepAmount: number;
}

/**
 * Resumo consolidado de preços e tributos de materiais por linha (RF-34, RF-51).
 */
export interface LineMaterialPricingSummary {
  lineId: string;
  lineName: string;
  taxRegime: TaxRegime;
  totalNetAmount: number; // Custo líquido total
  totalIpiAmount: number; // Total IPI
  totalIcmsOriginAmount: number; // Total ICMS Origem
  totalDifalAmount: number; // Total DIFAL
  totalFecoepAmount: number; // Total FECOEP
  totalPisAmount: number; // Total PIS
  totalCofinsAmount: number; // Total COFINS
  totalTaxesAmount: number; // Total de tributos incidentes
  totalGrossAmount: number; // Custo total com tributos
  directBillingAmount: number; // Parcela em faturamento direto ao cliente
  contractorBilledAmount: number; // Parcela faturada pela contratada
  totalReidiSavings: number; // Total economizado via REIDI
  items: ItemTaxBreakdown[];
  missingPriceItemCodes: string[]; // Códigos de itens com quantidade positiva sem preço (RF-29)
}
