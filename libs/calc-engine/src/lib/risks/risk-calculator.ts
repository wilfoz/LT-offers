import {
  RiskItem,
  RiskCategory,
  RiskAssessmentSummary,
  RiskCategorySummary,
} from '@lt-offers/domain';
import { DecimalValue } from '../decimal-value';

export class RiskCalculator {
  /**
   * Calcula a severidade ponderada de um item de risco:
   * Severidade = Impacto Estimado (R$) x Probabilidade (%) / 100 (RF-61).
   */
  static calculateItemSeverity(impact: number | string, probabilityPercent: number | string): string {
    const impactDec = DecimalValue.of(impact || '0');
    const probDec = DecimalValue.of(probabilityPercent || '0');

    return impactDec
      .times(probDec)
      .dividedBy(DecimalValue.of('100'))
      .round(2, 'half-up')
      .toFixed(2);
  }

  /**
   * Avalia e consolida a Matriz de Riscos de uma linha ou do lote (RF-61, RF-55).
   */
  static assessRisks(
    offerId: string,
    items: RiskItem[],
    lineId?: string
  ): RiskAssessmentSummary {
    const allCategories: RiskCategory[] = [
      'LAND_EASEMENT',
      'ENVIRONMENTAL',
      'SCHEDULE_TIMELINE',
      'WEATHER_RAIN',
      'GEOTECHNICAL_SOIL',
      'ENGINEERING_INTERFACE',
      'THIRD_PARTY_MARKET',
      'OTHER',
    ];

    const categoryMap = new Map<
      RiskCategory,
      { count: number; impactDec: DecimalValue; weightedDec: DecimalValue }
    >();

    for (const cat of allCategories) {
      categoryMap.set(cat, {
        count: 0,
        impactDec: DecimalValue.of('0'),
        weightedDec: DecimalValue.of('0'),
      });
    }

    let totalEstimatedImpactDec = DecimalValue.of('0');
    let totalWeightedSeverityDec = DecimalValue.of('0');
    let bdiContingencyAmountDec = DecimalValue.of('0');
    let commercialAssumptionAmountDec = DecimalValue.of('0');

    const processedItems: RiskItem[] = items.map((item) => {
      const severity = this.calculateItemSeverity(
        item.estimatedImpact,
        item.probabilityPercent
      );
      const impactDec = DecimalValue.of(item.estimatedImpact || '0');
      const severityDec = DecimalValue.of(severity);

      totalEstimatedImpactDec = totalEstimatedImpactDec.plus(impactDec);
      totalWeightedSeverityDec = totalWeightedSeverityDec.plus(severityDec);

      if (item.treatment === 'CONTINGENCY_BDI') {
        bdiContingencyAmountDec = bdiContingencyAmountDec.plus(severityDec);
      } else {
        commercialAssumptionAmountDec = commercialAssumptionAmountDec.plus(severityDec);
      }

      const catStat = categoryMap.get(item.category) || {
        count: 0,
        impactDec: DecimalValue.of('0'),
        weightedDec: DecimalValue.of('0'),
      };
      catStat.count += 1;
      catStat.impactDec = catStat.impactDec.plus(impactDec);
      catStat.weightedDec = catStat.weightedDec.plus(severityDec);
      categoryMap.set(item.category, catStat);

      return {
        ...item,
        weightedSeverity: severity,
      };
    });

    const categoryBreakdown: RiskCategorySummary[] = allCategories.map((cat) => {
      const stat = categoryMap.get(cat)!;
      return {
        category: cat,
        count: stat.count,
        totalImpact: stat.impactDec.round(2, 'half-up').toFixed(2),
        totalWeightedSeverity: stat.weightedDec.round(2, 'half-up').toFixed(2),
      };
    });

    return {
      offerId,
      lineId,
      items: processedItems,
      totalEstimatedImpact: totalEstimatedImpactDec.round(2, 'half-up').toFixed(2),
      totalWeightedSeverity: totalWeightedSeverityDec.round(2, 'half-up').toFixed(2),
      bdiContingencyAmount: bdiContingencyAmountDec.round(2, 'half-up').toFixed(2),
      commercialAssumptionAmount: commercialAssumptionAmountDec.round(2, 'half-up').toFixed(2),
      categoryBreakdown,
    };
  }

  /**
   * Converte um montante monetário de contingência da Matriz de Riscos em taxa percentual equivalente
   * sobre a base de custo próprio da proposta (RF-52, RF-55).
   */
  static calculateContingencyRateFromAmount(
    bdiContingencyAmount: number | string,
    baseOwnCost: number | string
  ): string {
    const contingencyDec = DecimalValue.of(bdiContingencyAmount || '0');
    const ownCostDec = DecimalValue.of(baseOwnCost || '0');

    if (ownCostDec.isZero() || ownCostDec.isNegative()) {
      return '0.00';
    }

    return contingencyDec
      .dividedBy(ownCostDec)
      .times(DecimalValue.of('100'))
      .round(2, 'half-up')
      .toFixed(2);
  }
}
