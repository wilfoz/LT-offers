import { Injectable } from '@nestjs/common';
import { WorkBaseline } from '@lt-offers/domain';
import { WbsGenerator } from '@lt-offers/calc-engine';
import { BaselinesRepository } from '../../../domain';

/**
 * Repositório in-memory das linhas de base (design, decisão 4): não há
 * tabelas de baseline no schema — a F7 foi entregue como simulação com
 * seeds. Quando a persistência chegar, apenas este adaptador vira Prisma.
 */
@Injectable()
export class InMemoryBaselinesRepository implements BaselinesRepository {
  private readonly baselines: Map<number, WorkBaseline> = new Map();
  private nextId = 1;

  constructor() {
    this.seedDefaultBaselines();
  }

  private seedDefaultBaselines(): void {
    const seedPackages = WbsGenerator.generateDefaultWorkPackages({
      totalContractValue: '124850000.00',
      totalBudgetCost: '102340000.00',
      civilCost: '27631800.00',
      electromechanicalCost: '30702000.00',
      lineCode: 'LT-01',
    });

    const seedBaseline: WorkBaseline = {
      id: 1,
      offerId: 1,
      revisionId: 1,
      baselineNumber: 0,
      name: 'Linha de Base Contratual Data 0 - Lote 1 Leilão 01/2026',
      status: 'ACTIVE',
      totalContractValue: '124850000.00',
      totalBudgetCost: '102340000.00',
      targetMarginPercent: '8.00',
      scheduleMonths: 18,
      frozenAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      frozenBy: 'diretor.comercial@engevix.com.br',
      notes:
        'Linha de base contratual congelada após vitória no Leilão Aneel 01/2026.',
      workPackages: seedPackages,
      createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    };

    this.baselines.set(seedBaseline.id, seedBaseline);
    this.nextId = 2;
  }

  async findActiveByOfferId(offerId: number): Promise<WorkBaseline | null> {
    for (const b of this.baselines.values()) {
      if (b.offerId === offerId && b.status === 'ACTIVE') {
        return b;
      }
    }
    return null;
  }

  async findById(id: number): Promise<WorkBaseline | null> {
    return this.baselines.get(id) ?? null;
  }

  async listByOfferId(offerId: number): Promise<WorkBaseline[]> {
    const list: WorkBaseline[] = [];
    for (const b of this.baselines.values()) {
      if (b.offerId === offerId) {
        list.push(b);
      }
    }
    return list;
  }

  async create(baseline: Omit<WorkBaseline, 'id'>): Promise<WorkBaseline> {
    const id = this.nextId++;
    const stored: WorkBaseline = { ...baseline, id };
    this.baselines.set(id, stored);
    return stored;
  }
}
