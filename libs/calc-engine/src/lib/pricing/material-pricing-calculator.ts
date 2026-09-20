import {
  ItemTaxBreakdown,
  LineMaterialPricingSummary,
  MaterialQuote,
  CommodityPricingConfig,
  TaxRegime,
  DestinationStateShare,
  IcmsRule,
  IpiRule,
  PisCofinsRule,
} from '@lt-offers/domain';
import { CommodityCalculator } from './commodity-calculator';
import { TaxCalculator } from '../tax/tax-calculator';
import { DecimalValue } from '../decimal-value';

/**
 * Item de material a ser precificado.
 */
export interface MaterialPricingInputItem {
  materialCode: string;
  materialName: string;
  family?: string;
  unit: string;
  quantity: number; // Quantidade total (teórica + extra + sobressalente)
  ncmCode?: string;
  isImported?: boolean;
  isCommodityLinked?: boolean;
  commodityConfig?: CommodityPricingConfig;
  customIpiPercent?: number;
}

/**
 * Entrada completa para cálculo de preços e tributos de uma linha (M06, RF-28, RF-29, RF-32).
 */
export interface LineMaterialPricingInput {
  lineId: string;
  lineName: string;
  taxRegime: TaxRegime;
  destinations: DestinationStateShare[];
  items: MaterialPricingInputItem[];
  quotesMap: Record<string, MaterialQuote>; // Código de material -> Cotação vencedora
  defaultOriginState?: string; // UF de origem padrão para itens sem cotação específica
  icmsRulesMap?: Record<string, IcmsRule>;
  ipiRulesMap?: Record<string, IpiRule>;
  pisCofinsRule?: PisCofinsRule;
}

/**
 * Calculador de precificação e consolidação tributária de materiais por linha (M06).
 */
export class MaterialPricingCalculator {
  /**
   * Executa a consolidação de preços, formação de commodities e memória tributária.
   */
  static calculateLinePricing(
    input: LineMaterialPricingInput,
  ): LineMaterialPricingSummary {
    const itemsBreakdowns: ItemTaxBreakdown[] = [];
    const missingPriceItemCodes: string[] = [];

    let totalNetDec = DecimalValue.zero();
    let totalIpiDec = DecimalValue.zero();
    let totalIcmsOriginDec = DecimalValue.zero();
    let totalDifalDec = DecimalValue.zero();
    let totalFecoepDec = DecimalValue.zero();
    let totalPisDec = DecimalValue.zero();
    let totalCofinsDec = DecimalValue.zero();
    let totalTaxesDec = DecimalValue.zero();
    let totalGrossDec = DecimalValue.zero();
    let directBillingDec = DecimalValue.zero();
    let contractorBilledDec = DecimalValue.zero();
    let totalReidiSavingsDec = DecimalValue.zero();

    const defaultOrigin = input.defaultOriginState || 'SP';

    for (const item of input.items) {
      const qtyDec = DecimalValue.of(item.quantity);

      // 1. Determinação do Preço Unitário Líquido
      let netUnitPrice = 0;
      let originState = defaultOrigin;

      if (item.isCommodityLinked && item.commodityConfig) {
        // Precificação via fórmula de commodity (RN-07)
        const formed = CommodityCalculator.calculatePricePerTon(
          item.commodityConfig,
        );
        netUnitPrice = formed.totalMetalPriceBrlPerTon;
      } else {
        const quote = input.quotesMap[item.materialCode];
        if (quote) {
          originState = quote.supplierState || defaultOrigin;
          // Conversão cambial se moeda estrangeira (RF-28)
          const quoteFx = quote.exchangeRateToBrl || 1.0;
          netUnitPrice = DecimalValue.of(quote.unitPrice)
            .times(DecimalValue.of(quoteFx))
            .round(2, 'half-up')
            .toNumber();
        }
      }

      // Validação de itens com quantidade sem preço (RF-29)
      if (qtyDec.greaterThan(DecimalValue.zero()) && netUnitPrice <= 0) {
        missingPriceItemCodes.push(item.materialCode);
      }

      // 2. Apuração Tributária do Item (RF-32, RF-34)
      const itemBreakdown = TaxCalculator.calculateItemTaxes(
        {
          itemCode: item.materialCode,
          itemName: item.materialName,
          ncmCode: item.ncmCode,
          netUnitPrice,
          quantity: item.quantity,
          originState,
          destinations: input.destinations,
          taxRegime: input.taxRegime,
          customIpiRatePercent: item.customIpiPercent,
          isImportedProduct: item.isImported,
        },
        input.icmsRulesMap,
        input.ipiRulesMap,
        input.pisCofinsRule,
      );

      itemsBreakdowns.push(itemBreakdown);

      // Acumulação nos Totais da Linha
      totalNetDec = totalNetDec.plus(
        DecimalValue.of(itemBreakdown.netTotalAmount),
      );
      totalIpiDec = totalIpiDec.plus(DecimalValue.of(itemBreakdown.ipiAmount));
      totalIcmsOriginDec = totalIcmsOriginDec.plus(
        DecimalValue.of(itemBreakdown.totalIcmsOriginAmount),
      );
      totalDifalDec = totalDifalDec.plus(
        DecimalValue.of(itemBreakdown.totalDifalAmount),
      );
      totalFecoepDec = totalFecoepDec.plus(
        DecimalValue.of(itemBreakdown.totalFecoepAmount),
      );
      totalPisDec = totalPisDec.plus(DecimalValue.of(itemBreakdown.pisAmount));
      totalCofinsDec = totalCofinsDec.plus(
        DecimalValue.of(itemBreakdown.cofinsAmount),
      );
      totalTaxesDec = totalTaxesDec.plus(
        DecimalValue.of(itemBreakdown.totalTaxesAmount),
      );
      totalGrossDec = totalGrossDec.plus(
        DecimalValue.of(itemBreakdown.grossTotalAmount),
      );
      totalReidiSavingsDec = totalReidiSavingsDec.plus(
        DecimalValue.of(itemBreakdown.reidiBenefitAmount),
      );

      if (itemBreakdown.isDirectBilling) {
        directBillingDec = directBillingDec.plus(
          DecimalValue.of(itemBreakdown.grossTotalAmount),
        );
      } else {
        contractorBilledDec = contractorBilledDec.plus(
          DecimalValue.of(itemBreakdown.grossTotalAmount),
        );
      }
    }

    return {
      lineId: input.lineId,
      lineName: input.lineName,
      taxRegime: input.taxRegime,
      totalNetAmount: totalNetDec.round(2, 'half-up').toNumber(),
      totalIpiAmount: totalIpiDec.round(2, 'half-up').toNumber(),
      totalIcmsOriginAmount: totalIcmsOriginDec.round(2, 'half-up').toNumber(),
      totalDifalAmount: totalDifalDec.round(2, 'half-up').toNumber(),
      totalFecoepAmount: totalFecoepDec.round(2, 'half-up').toNumber(),
      totalPisAmount: totalPisDec.round(2, 'half-up').toNumber(),
      totalCofinsAmount: totalCofinsDec.round(2, 'half-up').toNumber(),
      totalTaxesAmount: totalTaxesDec.round(2, 'half-up').toNumber(),
      totalGrossAmount: totalGrossDec.round(2, 'half-up').toNumber(),
      directBillingAmount: directBillingDec.round(2, 'half-up').toNumber(),
      contractorBilledAmount: contractorBilledDec
        .round(2, 'half-up')
        .toNumber(),
      totalReidiSavings: totalReidiSavingsDec.round(2, 'half-up').toNumber(),
      items: itemsBreakdowns,
      missingPriceItemCodes,
    };
  }
}
