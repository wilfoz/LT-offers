import {
  RiskCategory,
  RiskTreatment,
  RiskItem as DomainRiskItem,
  RiskAssessmentSummary,
} from '@lt-offers/domain';
import { RiskCalculator } from '@lt-offers/calc-engine';

export type { RiskCategory, RiskTreatment, RiskAssessmentSummary };

export class RiskItem implements DomainRiskItem {
  constructor(
    public readonly id: string,
    public readonly offerId: string,
    public readonly category: RiskCategory,
    public readonly description: string,
    public readonly situation: string,
    public readonly mitigationAction: string,
    public readonly estimatedImpact: string,
    public readonly probabilityPercent: string,
    public readonly weightedSeverity: string,
    public readonly treatment: RiskTreatment,
    public readonly lineId?: string,
  ) {}

  /**
   * Regra pura de domínio: Severidade = Impacto (R$) × Probabilidade (%) / 100
   */
  static calculateSeverity(
    estimatedImpact: string | number,
    probabilityPercent: string | number,
  ): string {
    return RiskCalculator.calculateItemSeverity(
      estimatedImpact,
      probabilityPercent,
    );
  }

  static create(props: {
    id: string;
    offerId: string;
    category: RiskCategory;
    description: string;
    situation: string;
    mitigationAction: string;
    estimatedImpact: string | number;
    probabilityPercent: string | number;
    treatment: RiskTreatment;
    lineId?: string;
  }): RiskItem {
    const impactFormatted = Number(props.estimatedImpact || 0).toFixed(2);
    const probFormatted = Number(props.probabilityPercent || 0).toFixed(2);
    const severity = RiskItem.calculateSeverity(impactFormatted, probFormatted);

    return new RiskItem(
      props.id,
      props.offerId,
      props.category,
      props.description,
      props.situation,
      props.mitigationAction,
      impactFormatted,
      probFormatted,
      severity,
      props.treatment,
      props.lineId,
    );
  }
}
