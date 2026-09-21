/**
 * Moedas suportadas para cotações de fornecedores e formação de preços (RF-28).
 */
export const SUPPORTED_CURRENCIES = ['BRL', 'USD', 'EUR'] as const;
export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

export const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  BRL: 'Real (R$)',
  USD: 'Dólar Americano (US$)',
  EUR: 'Euro (€)',
};

/**
 * Condições de fornecimento / Incoterms para cotações.
 */
export const INCOTERMS = ['FOB', 'CIF', 'EXW', 'DDP'] as const;
export type Incoterm = (typeof INCOTERMS)[number];

/**
 * Cotação de material por fornecedor (RF-28).
 */
export interface MaterialQuote {
  id: string;
  materialCode: string;
  materialName: string;
  supplierName: string;
  supplierState: string; // UF de origem (2 letras, ex.: 'SP', 'MG')
  unit: string;
  unitPrice: number; // Preço unitário líquido sem IPI/impostos por fora
  currency: CurrencyCode;
  exchangeRateToBrl: number; // Fator de conversão para BRL (ex.: 5.50 para USD, 1.0 para BRL)
  incoterm?: Incoterm;
  leadTimeDays?: number;
  validityDate?: string;
  notes?: string;
  isWinner?: boolean; // Fornecedor selecionado para a oferta
}

export interface SupplierQuoteMatrixSupplier {
  supplierName: string;
  supplierState: string;
  currency: CurrencyCode;
  unitPrice: number;
  unitPriceBrl: number;
  isWinner: boolean;
}

export interface SupplierQuoteMatrixItem {
  id: string;
  materialCode: string;
  materialName: string;
  unit: string;
  totalQuantity: string;
  suppliers: SupplierQuoteMatrixSupplier[];
  selectedSupplierName: string;
  selectedSupplierState: string;
  selectedUnitPriceBrl: number;
  totalNetBrl: number;
  ipiBrl: number;
  icmsOriginBrl: number;
  difalDestBrl: number;
  fecoepBrl: number;
  pisCofinsBrl: number;
  totalGrossBrl: number;
}

/**
 * DTO para seleção de cotação vencedora.
 */
export interface QuoteSelection {
  materialCode: string;
  selectedQuoteId: string;
  appliedExchangeRate: number;
  reason?: string;
}

