import { Injectable } from '@nestjs/common';
import {
  RiskItem,
  RiskCategory,
  RiskAssessmentSummary,
  RiskTreatment,
} from '@lt-offers/domain';
import { RiskCalculator } from '@lt-offers/calc-engine';

@Injectable()
export class RisksService {
  // Armazenamento em memória com sementes padrão por oferta
  private risksStore = new Map<string, RiskItem[]>();

  private getOrCreateOfferRisks(offerId: string, lineId?: string): RiskItem[] {
    let items = this.risksStore.get(offerId);
    if (!items) {
      items = [
        {
          id: `risk-seed-${offerId}-1`,
          offerId,
          lineId: lineId || '1',
          category: 'LAND_EASEMENT',
          description:
            'Negociação de servidão em trechos com ocupação periurbana',
          situation:
            'Levantamento cartorial preliminar apontou 12 imóveis sem regularização',
          mitigationAction:
            'Mobilização precoce de equipe fundiária e contato com lideranças locais',
          estimatedImpact: '650000.00',
          probabilityPercent: '30.00',
          weightedSeverity: '195000.00',
          treatment: 'CONTINGENCY_BDI',
        },
        {
          id: `risk-seed-${offerId}-2`,
          offerId,
          lineId: lineId || '1',
          category: 'GEOTECHNICAL_SOIL',
          description:
            'Aumento na proporção de solo rochoso em fundações com perfuração',
          situation:
            'Perfil geológico regional indica afloramento rochoso em 15% do traçado',
          mitigationAction:
            'Contratação de perfuratrizes rotativas adicionais sob demanda',
          estimatedImpact: '450000.00',
          probabilityPercent: '40.00',
          weightedSeverity: '180000.00',
          treatment: 'CONTINGENCY_BDI',
        },
        {
          id: `risk-seed-${offerId}-3`,
          offerId,
          category: 'THIRD_PARTY_MARKET',
          description: 'Flutuação de custos logísticos e de frete rodoviário',
          situation:
            'Variação potencial do preço do óleo diesel e tarifas de pedágio',
          mitigationAction:
            'Contrato de transporte de cargas com cláusula de teto máximo',
          estimatedImpact: '200000.00',
          probabilityPercent: '25.00',
          weightedSeverity: '50000.00',
          treatment: 'COMMERCIAL_ASSUMPTION',
        },
      ];
      this.risksStore.set(offerId, items);
    }
    return items;
  }

  getOfferRisks(offerId: string, lineId?: string): RiskAssessmentSummary {
    const allItems = this.getOrCreateOfferRisks(offerId, lineId);
    const filtered = lineId
      ? allItems.filter((i) => !i.lineId || i.lineId === lineId)
      : allItems;
    return RiskCalculator.assessRisks(offerId, filtered, lineId);
  }

  saveRisk(offerId: string, item: Partial<RiskItem>): RiskAssessmentSummary {
    const items = this.getOrCreateOfferRisks(offerId, item.lineId);
    const id =
      item.id ||
      `risk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const severity = RiskCalculator.calculateItemSeverity(
      item.estimatedImpact || '0',
      item.probabilityPercent || '0',
    );

    const fullItem: RiskItem = {
      id,
      offerId,
      lineId: item.lineId,
      category: item.category || 'OTHER',
      description: item.description || '',
      situation: item.situation || '',
      mitigationAction: item.mitigationAction || '',
      estimatedImpact: Number(item.estimatedImpact || 0).toFixed(2),
      probabilityPercent: Number(item.probabilityPercent || 0).toFixed(2),
      weightedSeverity: severity,
      treatment: item.treatment || 'CONTINGENCY_BDI',
    };

    const existingIndex = items.findIndex((i) => i.id === id);
    if (existingIndex >= 0) {
      items[existingIndex] = fullItem;
    } else {
      items.push(fullItem);
    }

    this.risksStore.set(offerId, items);
    return this.getOfferRisks(offerId, item.lineId);
  }

  deleteRisk(
    offerId: string,
    riskId: string,
    lineId?: string,
  ): RiskAssessmentSummary {
    const items = this.getOrCreateOfferRisks(offerId, lineId);
    const updated = items.filter((i) => i.id !== riskId);
    this.risksStore.set(offerId, updated);
    return this.getOfferRisks(offerId, lineId);
  }
}
