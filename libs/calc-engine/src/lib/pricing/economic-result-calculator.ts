import {
  SaleCoefficients,
  BdiBreakdown,
  EconomicResultLine,
  EconomicResultSummary,
  EconomicResultCategory,
  MarginSimulationInput,
  MarginSimulationOutput,
  RevisionComparisonResult,
} from '@lt-offers/domain';
import { DecimalValue } from '../decimal-value';

export interface EconomicResultInput {
  offerId: string;
  lineId?: string;
  lineName?: string;
  materials: {
    netCost: number | string;
    pisCofins: number | string;
    ipi: number | string;
    icmsOrigin: number | string;
    difal: number | string;
    fecoep: number | string;
    costWithTaxes: number | string;
    directBilling?: number | string;
  };
  services: {
    netCost: number | string;
    pisCofins?: number | string;
    costWithTaxes: number | string;
    directBilling?: number | string;
  };
  indirectsCamps: {
    netCost: number | string;
    costWithTaxes: number | string;
  };
  spareParts?: {
    netCost: number | string;
    costWithTaxes: number | string;
  };
  coefficients: SaleCoefficients;
  ipcaAnnualRate?: number | string;
  projectDurationMonths?: number;
}

export class EconomicResultCalculator {
  /**
   * Calcula a decomposição de BDI a partir dos coeficientes de venda K (RF-52).
   */
  static calculateBdi(coeffs: SaleCoefficients): BdiBreakdown {
    const guarantees = DecimalValue.of(coeffs.guaranteesRate || '0');
    const insurances = DecimalValue.of(coeffs.insurancesRate || '0');
    const idde = DecimalValue.of(coeffs.iddeRate || '0');
    const countryRisk = DecimalValue.of(coeffs.countryRiskRate || '0');
    const financialCost = DecimalValue.of(coeffs.financialCostRate || '0');
    const contingency = DecimalValue.of(coeffs.contingencyRate || '0');
    const centralStructure = DecimalValue.of(
      coeffs.centralStructureRate || '0',
    );
    const targetMargin = DecimalValue.of(coeffs.targetMarginRate || '0');
    const productionTax = DecimalValue.of(coeffs.productionTaxRate || '0');

    // K_indiretos = soma das taxas de overhead, risco, garantias e financeiro
    const totalIndirectRate = guarantees
      .plus(insurances)
      .plus(idde)
      .plus(countryRisk)
      .plus(financialCost)
      .plus(contingency)
      .plus(centralStructure);

    // Numerador = 1 + (K_indiretos / 100)
    const numerator = DecimalValue.of('1').plus(
      totalIndirectRate.dividedBy(DecimalValue.of('100')),
    );

    // Denominador = 1 - ((Impostos s/ faturamento + Margem) / 100)
    const deductionsRate = productionTax.plus(targetMargin);
    const denominator = DecimalValue.of('1').minus(
      deductionsRate.dividedBy(DecimalValue.of('100')),
    );

    const safeDenominator =
      denominator.isZero() || denominator.isNegative()
        ? DecimalValue.of('0.01')
        : denominator;

    const bdiMultiplier = numerator
      .dividedBy(safeDenominator)
      .round(4, 'half-up');
    const effectiveBdiRate = bdiMultiplier
      .minus(DecimalValue.of('1'))
      .times(DecimalValue.of('100'))
      .round(2, 'half-up');

    // Margem bruta = 1 - (1 / bdiMultiplier)
    const grossMarginRate = DecimalValue.of('1')
      .minus(DecimalValue.of('1').dividedBy(bdiMultiplier))
      .times(DecimalValue.of('100'))
      .round(2, 'half-up');

    return {
      totalIndirectRate: totalIndirectRate.toFixed(2),
      grossMarginRate: grossMarginRate.toFixed(2),
      effectiveBdiRate: effectiveBdiRate.toFixed(2),
      bdiMultiplier: bdiMultiplier.toFixed(4),
    };
  }

  /**
   * Constrói o Quadro R completo com consolidação de custos, impostos e preço de venda (RF-51..RF-56).
   */
  static calculateEconomicResult(
    input: EconomicResultInput,
  ): EconomicResultSummary {
    const bdi = this.calculateBdi(input.coefficients);
    const bdiMultiplier = DecimalValue.of(bdi.bdiMultiplier);

    const lines: EconomicResultLine[] = [];

    const addLine = (
      category: EconomicResultCategory,
      desc: string,
      net: number | string,
      pisCofins: number | string,
      ipi: number | string,
      icmsOrigin: number | string,
      difal: number | string,
      fecoep: number | string,
      costWithTaxes: number | string,
      directBilling: number | string = 0,
    ) => {
      const netDec = DecimalValue.of(net || '0');
      const pisCofinsDec = DecimalValue.of(pisCofins || '0');
      const ipiDec = DecimalValue.of(ipi || '0');
      const icmsOriginDec = DecimalValue.of(icmsOrigin || '0');
      const difalDec = DecimalValue.of(difal || '0');
      const fecoepDec = DecimalValue.of(fecoep || '0');
      const costWithTaxesDec = DecimalValue.of(costWithTaxes || '0');
      const directBillingDec = DecimalValue.of(directBilling || '0');

      const ownCostDec = costWithTaxesDec.minus(directBillingDec);
      const salePriceDec = ownCostDec
        .times(bdiMultiplier)
        .plus(directBillingDec)
        .round(2, 'half-up');

      lines.push({
        category,
        description: desc,
        netCost: netDec.toFixed(2),
        pisCofins: pisCofinsDec.toFixed(2),
        ipi: ipiDec.toFixed(2),
        icmsOrigin: icmsOriginDec.toFixed(2),
        difal: difalDec.toFixed(2),
        fecoep: fecoepDec.toFixed(2),
        costWithTaxes: costWithTaxesDec.toFixed(2),
        directBilling: directBillingDec.toFixed(2),
        ownCost: ownCostDec.toFixed(2),
        salePrice: salePriceDec.toFixed(2),
      });
    };

    // 1. Materiais
    addLine(
      'MATERIALS',
      'Fornecimento de Materiais e Equipamentos Principais',
      input.materials.netCost,
      input.materials.pisCofins,
      input.materials.ipi,
      input.materials.icmsOrigin,
      input.materials.difal,
      input.materials.fecoep,
      input.materials.costWithTaxes,
      input.materials.directBilling || 0,
    );

    // 2. Serviços
    addLine(
      'SERVICES',
      'Serviços de Construção e Montagem Eletromecânica',
      input.services.netCost,
      input.services.pisCofins || 0,
      0,
      0,
      0,
      0,
      input.services.costWithTaxes,
      input.services.directBilling || 0,
    );

    // 3. Indiretos e Canteiros
    addLine(
      'INDIRECTS_CAMPS',
      'Canteiros de Obra e Custos Indiretos de Projeto',
      input.indirectsCamps.netCost,
      0,
      0,
      0,
      0,
      0,
      input.indirectsCamps.costWithTaxes,
      0,
    );

    // 4. Sobressalentes (se houver)
    if (input.spareParts) {
      addLine(
        'SPARE_PARTS',
        'Peças Sobressalentes Contratuais (Spares)',
        input.spareParts.netCost,
        0,
        0,
        0,
        0,
        0,
        input.spareParts.costWithTaxes,
        0,
      );
    }

    // Totais
    let totalNet = DecimalValue.zero();
    let totalPisCofins = DecimalValue.zero();
    let totalIpi = DecimalValue.zero();
    let totalIcms = DecimalValue.zero();
    let totalDifal = DecimalValue.zero();
    let totalFecoep = DecimalValue.zero();
    let totalCostWithTaxes = DecimalValue.zero();
    let totalDirectBilling = DecimalValue.zero();
    let totalOwnCost = DecimalValue.zero();
    let totalSalePrice = DecimalValue.zero();

    for (const l of lines) {
      totalNet = totalNet.plus(DecimalValue.of(l.netCost));
      totalPisCofins = totalPisCofins.plus(DecimalValue.of(l.pisCofins));
      totalIpi = totalIpi.plus(DecimalValue.of(l.ipi));
      totalIcms = totalIcms.plus(DecimalValue.of(l.icmsOrigin));
      totalDifal = totalDifal.plus(DecimalValue.of(l.difal));
      totalFecoep = totalFecoep.plus(DecimalValue.of(l.fecoep));
      totalCostWithTaxes = totalCostWithTaxes.plus(
        DecimalValue.of(l.costWithTaxes),
      );
      totalDirectBilling = totalDirectBilling.plus(
        DecimalValue.of(l.directBilling),
      );
      totalOwnCost = totalOwnCost.plus(DecimalValue.of(l.ownCost));
      totalSalePrice = totalSalePrice.plus(DecimalValue.of(l.salePrice));
    }

    const grossProfit = totalSalePrice.minus(totalCostWithTaxes);
    const grossMarginPercent = totalSalePrice.isZero()
      ? '0.00'
      : grossProfit
          .dividedBy(totalSalePrice)
          .times(DecimalValue.of('100'))
          .toFixed(2);

    // Projeção de corrosão por IPCA (RF-54)
    const ipcaRateDec = DecimalValue.of(input.ipcaAnnualRate || '4.50');
    const durationMonths = input.projectDurationMonths || 18;
    const years = DecimalValue.of(durationMonths).dividedBy(
      DecimalValue.of('12'),
    );
    const totalInflationFactor = ipcaRateDec
      .dividedBy(DecimalValue.of('100'))
      .times(years);
    // Impacto estimado do descasamento de reajuste sobre os custos próprios
    const ipcaDegradationDec = totalOwnCost
      .times(totalInflationFactor)
      .dividedBy(DecimalValue.of('2'))
      .round(2, 'half-up');

    return {
      offerId: input.offerId,
      lineId: input.lineId,
      lineName: input.lineName,
      lines,
      totalNetCost: totalNet.toFixed(2),
      totalPisCofins: totalPisCofins.toFixed(2),
      totalIpi: totalIpi.toFixed(2),
      totalIcmsOrigin: totalIcms.toFixed(2),
      totalDifal: totalDifal.toFixed(2),
      totalFecoep: totalFecoep.toFixed(2),
      totalCostWithTaxes: totalCostWithTaxes.toFixed(2),
      totalDirectBilling: totalDirectBilling.toFixed(2),
      totalOwnCost: totalOwnCost.toFixed(2),
      totalSalePrice: totalSalePrice.toFixed(2),
      grossProfit: grossProfit.toFixed(2),
      grossMarginPercent,
      netMarginPercent: input.coefficients.targetMarginRate,
      coefficients: input.coefficients,
      bdi,
      ipcaAnnualRate: ipcaRateDec.toFixed(2),
      projectDurationMonths: durationMonths,
      ipcaTotalDegradationCost: ipcaDegradationDec.toFixed(2),
    };
  }

  /**
   * Simulador bidirecional de Preço de Venda vs Margem Alvo (RF-53).
   */
  static simulateMarginOrPrice(
    baseSummary: EconomicResultSummary,
    simInput: MarginSimulationInput,
  ): MarginSimulationOutput {
    const totalOwnCost = DecimalValue.of(baseSummary.totalOwnCost);
    const totalDirectBilling = DecimalValue.of(baseSummary.totalDirectBilling);
    const originalPrice = DecimalValue.of(baseSummary.totalSalePrice);

    const guarantees = DecimalValue.of(
      baseSummary.coefficients.guaranteesRate || '0',
    );
    const insurances = DecimalValue.of(
      baseSummary.coefficients.insurancesRate || '0',
    );
    const idde = DecimalValue.of(baseSummary.coefficients.iddeRate || '0');
    const countryRisk = DecimalValue.of(
      baseSummary.coefficients.countryRiskRate || '0',
    );
    const financialCost = DecimalValue.of(
      baseSummary.coefficients.financialCostRate || '0',
    );
    const contingency = DecimalValue.of(
      baseSummary.coefficients.contingencyRate || '0',
    );
    const centralStructure = DecimalValue.of(
      baseSummary.coefficients.centralStructureRate || '0',
    );
    const productionTax = DecimalValue.of(
      baseSummary.coefficients.productionTaxRate || '0',
    );

    const totalIndirectRate = guarantees
      .plus(insurances)
      .plus(idde)
      .plus(countryRisk)
      .plus(financialCost)
      .plus(contingency)
      .plus(centralStructure);

    const numerator = DecimalValue.of('1').plus(
      totalIndirectRate.dividedBy(DecimalValue.of('100')),
    );

    // Caso 1: Forçar Preço de Venda -> Obter Margem Resultante
    if (simInput.forcedSalePrice) {
      const forcedPrice = DecimalValue.of(simInput.forcedSalePrice);
      const forcedOwnSale = forcedPrice.minus(totalDirectBilling);

      if (
        forcedOwnSale.isZero() ||
        forcedOwnSale.isNegative() ||
        totalOwnCost.isZero()
      ) {
        return {
          simulatedSalePrice: forcedPrice.toFixed(2),
          resultingNetMarginRate: '0.00',
          resultingGrossProfit: forcedPrice
            .minus(DecimalValue.of(baseSummary.totalCostWithTaxes))
            .toFixed(2),
          effectiveBdiRate: '0.00',
          differenceFromOriginalPrice: forcedPrice
            .minus(originalPrice)
            .toFixed(2),
        };
      }

      // forcedOwnSale = totalOwnCost * (numerator / (1 - (prodTax + Margem)/100))
      // 1 - (prodTax + Margem)/100 = (totalOwnCost * numerator) / forcedOwnSale
      const costFactor = totalOwnCost.times(numerator).dividedBy(forcedOwnSale);
      const netMarginDec = DecimalValue.of('1')
        .minus(productionTax.dividedBy(DecimalValue.of('100')))
        .minus(costFactor)
        .times(DecimalValue.of('100'))
        .round(2, 'half-up');

      const bdiMult = forcedOwnSale.dividedBy(totalOwnCost);
      const effectiveBdi = bdiMult
        .minus(DecimalValue.of('1'))
        .times(DecimalValue.of('100'))
        .round(2, 'half-up');
      const grossProfit = forcedPrice.minus(
        DecimalValue.of(baseSummary.totalCostWithTaxes),
      );

      return {
        simulatedSalePrice: forcedPrice.toFixed(2),
        resultingNetMarginRate: netMarginDec.toFixed(2),
        resultingGrossProfit: grossProfit.toFixed(2),
        effectiveBdiRate: effectiveBdi.toFixed(2),
        differenceFromOriginalPrice: forcedPrice
          .minus(originalPrice)
          .toFixed(2),
      };
    }

    // Caso 2: Forçar Margem Alvo -> Obter Preço Resultante
    const newMargin = DecimalValue.of(
      simInput.targetMarginRate ||
        baseSummary.coefficients.targetMarginRate ||
        '8.00',
    );
    const deductionsRate = productionTax.plus(newMargin);
    const denominator = DecimalValue.of('1').minus(
      deductionsRate.dividedBy(DecimalValue.of('100')),
    );
    const safeDenominator =
      denominator.isZero() || denominator.isNegative()
        ? DecimalValue.of('0.01')
        : denominator;

    const bdiMult = numerator.dividedBy(safeDenominator);
    const effectiveBdi = bdiMult
      .minus(DecimalValue.of('1'))
      .times(DecimalValue.of('100'))
      .round(2, 'half-up');
    const newSalePrice = totalOwnCost
      .times(bdiMult)
      .plus(totalDirectBilling)
      .round(2, 'half-up');
    const grossProfit = newSalePrice.minus(
      DecimalValue.of(baseSummary.totalCostWithTaxes),
    );

    return {
      simulatedSalePrice: newSalePrice.toFixed(2),
      resultingNetMarginRate: newMargin.toFixed(2),
      resultingGrossProfit: grossProfit.toFixed(2),
      effectiveBdiRate: effectiveBdi.toFixed(2),
      differenceFromOriginalPrice: newSalePrice.minus(originalPrice).toFixed(2),
    };
  }

  /**
   * Compara duas revisões de uma oferta identificando causas-raiz da variação (RF-56).
   */
  static compareRevisions(
    baseSummary: EconomicResultSummary,
    targetSummary: EconomicResultSummary,
    baseRevNum: number,
    targetRevNum: number,
  ): RevisionComparisonResult {
    const basePrice = DecimalValue.of(baseSummary.totalSalePrice);
    const targetPrice = DecimalValue.of(targetSummary.totalSalePrice);
    const deltaSalePrice = targetPrice.minus(basePrice);

    // Delta por grupo de custo
    const baseMatLine = baseSummary.lines.find(
      (l) => l.category === 'MATERIALS',
    );
    const targetMatLine = targetSummary.lines.find(
      (l) => l.category === 'MATERIALS',
    );
    const baseSrvLine = baseSummary.lines.find(
      (l) => l.category === 'SERVICES',
    );
    const targetSrvLine = targetSummary.lines.find(
      (l) => l.category === 'SERVICES',
    );

    const baseMatNet = DecimalValue.of(baseMatLine?.netCost || '0');
    const targetMatNet = DecimalValue.of(targetMatLine?.netCost || '0');
    const baseMatTax = DecimalValue.of(baseMatLine?.costWithTaxes || '0').minus(
      baseMatNet,
    );
    const targetMatTax = DecimalValue.of(
      targetMatLine?.costWithTaxes || '0',
    ).minus(targetMatNet);

    const baseSrvTotal = DecimalValue.of(baseSrvLine?.costWithTaxes || '0');
    const targetSrvTotal = DecimalValue.of(targetSrvLine?.costWithTaxes || '0');

    const matNetDelta = targetMatNet.minus(baseMatNet);
    const taxDelta = targetMatTax.minus(baseMatTax);
    const srvDelta = targetSrvTotal.minus(baseSrvTotal);

    // Variação de margem e coeficientes
    const costDelta = matNetDelta.plus(taxDelta).plus(srvDelta);
    const marginCoeffDelta = deltaSalePrice.minus(costDelta);

    return {
      baseRevisionNumber: baseRevNum,
      targetRevisionNumber: targetRevNum,
      baseSalePrice: basePrice.toFixed(2),
      targetSalePrice: targetPrice.toFixed(2),
      deltaSalePrice: deltaSalePrice.toFixed(2),
      breakdownByCause: {
        materialsQuantityDelta: matNetDelta
          .times(DecimalValue.of('0.4'))
          .toFixed(2), // Estimativa de peso de quantidade
        materialsPriceDelta: matNetDelta
          .times(DecimalValue.of('0.6'))
          .toFixed(2), // Estimativa de peso de preço
        taxRateDelta: taxDelta.toFixed(2),
        servicesDelta: srvDelta.toFixed(2),
        marginCoefficientsDelta: marginCoeffDelta.toFixed(2),
      },
    };
  }
}
