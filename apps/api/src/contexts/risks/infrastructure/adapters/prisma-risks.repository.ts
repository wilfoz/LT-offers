import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../app/prisma.service';
import { RiskItem, RisksRepository } from '../../domain';

@Injectable()
export class PrismaRisksRepository implements RisksRepository {
  private static store = new Map<string, RiskItem[]>();

  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService | Prisma.TransactionClient,
  ) {}

  private getOrCreateOfferRisks(offerId: string, lineId?: string): RiskItem[] {
    let items = PrismaRisksRepository.store.get(offerId);
    if (!items) {
      items = [
        RiskItem.create({
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
          treatment: 'CONTINGENCY_BDI',
        }),
        RiskItem.create({
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
          treatment: 'CONTINGENCY_BDI',
        }),
        RiskItem.create({
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
          treatment: 'COMMERCIAL_ASSUMPTION',
        }),
      ];
      PrismaRisksRepository.store.set(offerId, items);
    }
    return items;
  }

  async findByOffer(offerId: string, lineId?: string): Promise<RiskItem[]> {
    return this.getOrCreateOfferRisks(offerId, lineId);
  }

  async findById(offerId: string, riskId: string): Promise<RiskItem | null> {
    const items = this.getOrCreateOfferRisks(offerId);
    return items.find((i) => i.id === riskId) || null;
  }

  async save(offerId: string, risk: RiskItem): Promise<void> {
    const items = this.getOrCreateOfferRisks(offerId, risk.lineId);
    const existingIndex = items.findIndex((i) => i.id === risk.id);
    if (existingIndex >= 0) {
      items[existingIndex] = risk;
    } else {
      items.push(risk);
    }
    PrismaRisksRepository.store.set(offerId, items);
  }

  async delete(offerId: string, riskId: string): Promise<void> {
    const items = this.getOrCreateOfferRisks(offerId);
    const updated = items.filter((i) => i.id !== riskId);
    PrismaRisksRepository.store.set(offerId, updated);
  }
}
