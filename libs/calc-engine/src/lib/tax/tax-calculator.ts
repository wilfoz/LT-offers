import {
  ItemTaxCalculationInput,
  ItemTaxBreakdown,
  DestinationTaxBreakdown,
  IcmsRule,
  IpiRule,
  PisCofinsRule,
  DifalMethod,
} from '@lt-offers/domain';
import { DecimalValue } from '../decimal-value';

/**
 * Calculador puro de tributos brasileiros para materiais de LT (RN-04, RN-05, RN-06, RF-32, RF-34).
 */
export class TaxCalculator {
  /**
   * Alíquota padrão interestadual para produtos importados (Resolução SF 13/2012).
   */
  private static readonly IMPORTED_INTERSTATE_RATE = 4.0;

  /**
   * Alíquotas padrão não-cumulativo PIS/COFINS (Lei 10.637/2002 e 10.833/2003).
   */
  private static readonly DEFAULT_PIS_RATE = 1.65;
  private static readonly DEFAULT_COFINS_RATE = 7.6;

  /**
   * Calcula a memória tributária analítica completa de um item de material.
   */
  static calculateItemTaxes(
    input: ItemTaxCalculationInput,
    icmsRulesMap?: Record<string, IcmsRule>,
    ipiRulesMap?: Record<string, IpiRule>,
    pisCofinsRule?: PisCofinsRule,
  ): ItemTaxBreakdown {
    const unitPriceDec = DecimalValue.of(input.netUnitPrice);
    const qtyDec = DecimalValue.of(input.quantity);
    const netTotalDec = unitPriceDec.times(qtyDec).round(2, 'half-up');

    // 1. IPI
    let ipiRate = 0;
    if (input.customIpiRatePercent !== undefined) {
      ipiRate = input.customIpiRatePercent;
    } else if (input.ncmCode && ipiRulesMap && ipiRulesMap[input.ncmCode]) {
      ipiRate = ipiRulesMap[input.ncmCode].ratePercent;
    }
    const ipiRateDec = DecimalValue.of(ipiRate).dividedBy(DecimalValue.of(100));
    const ipiAmountDec = netTotalDec.times(ipiRateDec).round(2, 'half-up');

    // 2. Destinos e Rateios de ICMS / DIFAL / FECOEP
    const destinations =
      input.destinations && input.destinations.length > 0
        ? input.destinations
        : [{ state: input.originState, sharePercent: 100 }];

    const destinationBreakdowns: DestinationTaxBreakdown[] = [];
    let totalIcmsOriginDec = DecimalValue.zero();
    let totalDifalDec = DecimalValue.zero();
    let totalFecoepDec = DecimalValue.zero();

    for (const dest of destinations) {
      const shareRateDec = DecimalValue.of(dest.sharePercent).dividedBy(
        DecimalValue.of(100),
      );
      const allocatedBaseDec = netTotalDec.times(shareRateDec).round(2, 'half-up');

      const destBreakdown = this.calculateDestinationIcmsAndDifal(
        input.originState,
        dest.state,
        dest.sharePercent,
        allocatedBaseDec,
        input.isImportedProduct,
        icmsRulesMap,
      );

      destinationBreakdowns.push(destBreakdown);
      totalIcmsOriginDec = totalIcmsOriginDec.plus(
        DecimalValue.of(destBreakdown.icmsOriginAmount),
      );
      totalDifalDec = totalDifalDec.plus(DecimalValue.of(destBreakdown.difalAmount));
      totalFecoepDec = totalFecoepDec.plus(
        DecimalValue.of(destBreakdown.fecoepAmount),
      );
    }

    // 3. PIS / COFINS & Benefício REIDI
    let pisRate = pisCofinsRule?.pisRatePercent ?? this.DEFAULT_PIS_RATE;
    let cofinsRate = pisCofinsRule?.cofinsRatePercent ?? this.DEFAULT_COFINS_RATE;

    const isReidiOrDirect =
      input.taxRegime === 'REIDI' || input.taxRegime === 'DIRECT_BILLING';

    let pisAmountDec = DecimalValue.zero();
    let cofinsAmountDec = DecimalValue.zero();
    let reidiBenefitDec = DecimalValue.zero();

    const standardPisDec = netTotalDec
      .times(DecimalValue.of(this.DEFAULT_PIS_RATE).dividedBy(DecimalValue.of(100)))
      .round(2, 'half-up');
    const standardCofinsDec = netTotalDec
      .times(
        DecimalValue.of(this.DEFAULT_COFINS_RATE).dividedBy(DecimalValue.of(100)),
      )
      .round(2, 'half-up');

    if (isReidiOrDirect) {
      pisRate = 0;
      cofinsRate = 0;
      reidiBenefitDec = standardPisDec.plus(standardCofinsDec);
    } else {
      pisAmountDec = netTotalDec
        .times(DecimalValue.of(pisRate).dividedBy(DecimalValue.of(100)))
        .round(2, 'half-up');
      cofinsAmountDec = netTotalDec
        .times(DecimalValue.of(cofinsRate).dividedBy(DecimalValue.of(100)))
        .round(2, 'half-up');
    }

    // 4. Consolidação Final
    // Tributos agregados ao custo do material: IPI + DIFAL + FECOEP + PIS + COFINS
    const totalTaxesDec = ipiAmountDec
      .plus(totalDifalDec)
      .plus(totalFecoepDec)
      .plus(pisAmountDec)
      .plus(cofinsAmountDec);

    const grossTotalDec = netTotalDec.plus(totalTaxesDec);
    const grossUnitPriceDec = qtyDec.greaterThan(DecimalValue.zero())
      ? grossTotalDec.dividedBy(qtyDec).round(2, 'half-up')
      : grossTotalDec;

    return {
      itemCode: input.itemCode,
      itemName: input.itemName,
      quantity: qtyDec.toNumber(),
      netUnitPrice: unitPriceDec.toNumber(),
      netTotalAmount: netTotalDec.toNumber(),
      ipiRatePercent: ipiRate,
      ipiAmount: ipiAmountDec.toNumber(),
      originState: input.originState,
      destinationBreakdowns,
      totalIcmsOriginAmount: totalIcmsOriginDec.round(2, 'half-up').toNumber(),
      totalDifalAmount: totalDifalDec.round(2, 'half-up').toNumber(),
      totalFecoepAmount: totalFecoepDec.round(2, 'half-up').toNumber(),
      pisRatePercent: pisRate,
      pisAmount: pisAmountDec.toNumber(),
      cofinsRatePercent: cofinsRate,
      cofinsAmount: cofinsAmountDec.toNumber(),
      totalTaxesAmount: totalTaxesDec.round(2, 'half-up').toNumber(),
      grossTotalAmount: grossTotalDec.round(2, 'half-up').toNumber(),
      grossUnitPrice: grossUnitPriceDec.toNumber(),
      isDirectBilling: input.taxRegime === 'DIRECT_BILLING',
      reidiBenefitAmount: reidiBenefitDec.round(2, 'half-up').toNumber(),
    };
  }

  /**
   * Apura ICMS de origem, DIFAL e FECOEP para uma UF de destino específica (RN-05).
   */
  private static calculateDestinationIcmsAndDifal(
    originState: string,
    destinationState: string,
    sharePercent: number,
    allocatedBase: DecimalValue,
    isImportedProduct?: boolean,
    icmsRulesMap?: Record<string, IcmsRule>,
  ): DestinationTaxBreakdown {
    const pairKey = `${originState}->${destinationState}`;
    const rule = icmsRulesMap ? icmsRulesMap[pairKey] : undefined;

    // Resolução de Alíquotas e Métodos
    const isInternal = originState.toUpperCase() === destinationState.toUpperCase();
    let interstateRate = isInternal ? 18.0 : 12.0;
    let internalRate = 18.0;
    let fecoepRate = 0.0;
    let difalMethod: DifalMethod = 'DOUBLE_BASE';

    if (rule) {
      interstateRate = isImportedProduct
        ? this.IMPORTED_INTERSTATE_RATE
        : rule.interstateRatePercent;
      internalRate = rule.internalDestinationRatePercent;
      fecoepRate = rule.fecoepRatePercent;
      difalMethod = rule.difalMethod;
    } else {
      // Regras padrão de ICMS interestadual
      if (isImportedProduct) {
        interstateRate = this.IMPORTED_INTERSTATE_RATE;
      } else if (['SP', 'RJ', 'MG', 'PR', 'SC', 'RS'].includes(originState.toUpperCase()) &&
                 !['SP', 'RJ', 'MG', 'PR', 'SC', 'RS'].includes(destinationState.toUpperCase())) {
        interstateRate = 7.0; // Sul/Sudeste para N/NE/CO/ES
      }
    }

    const interstateRateDec = DecimalValue.of(interstateRate).dividedBy(
      DecimalValue.of(100),
    );
    const internalRateDec = DecimalValue.of(internalRate).dividedBy(
      DecimalValue.of(100),
    );
    const fecoepRateDec = DecimalValue.of(fecoepRate).dividedBy(
      DecimalValue.of(100),
    );

    // ICMS Origem
    const icmsOriginAmountDec = allocatedBase
      .times(interstateRateDec)
      .round(2, 'half-up');

    let reconstitutedBaseDec = allocatedBase;
    let difalAmountDec = DecimalValue.zero();
    let fecoepAmountDec = DecimalValue.zero();

    if (!isInternal) {
      if (difalMethod === 'SINGLE_BASE') {
        // Base Simples: DIFAL = Base * (AliqInterna - AliqInter)
        const rateDiff = internalRateDec.minus(interstateRateDec);
        if (rateDiff.greaterThan(DecimalValue.zero())) {
          difalAmountDec = allocatedBase.times(rateDiff).round(2, 'half-up');
        }
        fecoepAmountDec = allocatedBase.times(fecoepRateDec).round(2, 'half-up');
      } else {
        // Base Dupla (Reconstituição por dentro no destino)
        // Base2 = (BaseOrigem - ICMS_Origem) / (1 - (AliqInterna + AliqFecoep))
        const totalDestRate = internalRateDec.plus(fecoepRateDec);
        const divisor = DecimalValue.of(1).minus(totalDestRate);

        if (!divisor.isZero() && divisor.greaterThan(DecimalValue.zero())) {
          const numerator = allocatedBase.minus(icmsOriginAmountDec);
          reconstitutedBaseDec = numerator.dividedBy(divisor).round(2, 'half-up');

          const totalDestIcms = reconstitutedBaseDec
            .times(internalRateDec)
            .round(2, 'half-up');
          difalAmountDec = totalDestIcms
            .minus(icmsOriginAmountDec)
            .round(2, 'half-up');

          if (!difalAmountDec.greaterThan(DecimalValue.zero())) {
            difalAmountDec = DecimalValue.zero();
          }

          fecoepAmountDec = reconstitutedBaseDec
            .times(fecoepRateDec)
            .round(2, 'half-up');
        }
      }
    }

    return {
      destinationState,
      sharePercent,
      interstateRatePercent: interstateRate,
      internalRatePercent: internalRate,
      fecoepRatePercent: fecoepRate,
      difalMethod,
      allocatedNetBase: allocatedBase.toNumber(),
      icmsOriginAmount: icmsOriginAmountDec.toNumber(),
      reconstitutedDestinationBase: reconstitutedBaseDec.toNumber(),
      difalAmount: difalAmountDec.toNumber(),
      fecoepAmount: fecoepAmountDec.toNumber(),
    };
  }
}
