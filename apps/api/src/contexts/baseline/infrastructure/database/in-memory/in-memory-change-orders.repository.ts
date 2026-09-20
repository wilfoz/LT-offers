import { Injectable } from '@nestjs/common';
import { ContractChangeOrder } from '@lt-offers/domain';
import { ChangeOrdersRepository } from '../../../domain';

/**
 * Repositório in-memory de aditivos e pleitos, com seeds e regra de ID
 * global sequencial herdados do legado (design, decisão 4).
 */
@Injectable()
export class InMemoryChangeOrdersRepository implements ChangeOrdersRepository {
  private readonly changeOrders: Map<number, ContractChangeOrder[]> = new Map();
  private nextId = 1;

  constructor() {
    this.seedDefaultChangeOrders();
  }

  private seedDefaultChangeOrders(): void {
    const seedOrders: ContractChangeOrder[] = [
      {
        id: 1,
        baselineId: 1,
        code: 'AD-01',
        title: 'Adequação geotécnica para solo rochoso nos piquetes 45 a 65',
        type: 'GEOTECHNICAL_SOIL',
        status: 'APPROVED',
        requestedCostDelta: '1850000.00',
        approvedCostDelta: '1850000.00',
        scheduleDeltaMonths: 1,
        description:
          'Substituição de fundações tubulão por estacas raiz com injeção de calda de cimento em rocha branda.',
        justification:
          'Relatório de sondagens rotativas complementares SRLT-02.',
        wbsCodeAffected: '03.01',
        approvedBy: 'gerente.contrato@cliente.com.br',
        approvedAt: '2026-03-15T10:00:00.000Z',
        createdBy: 'eng.geotecnico@engevix.com.br',
        createdAt: '2026-03-01T10:00:00.000Z',
        updatedAt: '2026-03-15T10:00:00.000Z',
      },
      {
        id: 2,
        baselineId: 1,
        code: 'AD-02',
        title: 'Inclusão de torre adicional para travessia de duto de gás',
        type: 'SCOPE_ADDITION',
        status: 'APPROVED',
        requestedCostDelta: '720000.00',
        approvedCostDelta: '680000.00',
        scheduleDeltaMonths: 0,
        description:
          'Instalação de estrutura estaiada tipo E-30 adicional para garantir vão de segurança exigido pela TBG.',
        justification: 'Diretriz de segurança da Transpetro/TBG.',
        wbsCodeAffected: '04.01',
        approvedBy: 'fiscal.obra@cliente.com.br',
        approvedAt: '2026-04-10T11:00:00.000Z',
        createdBy: 'eng.eletromecanico@engevix.com.br',
        createdAt: '2026-04-01T10:00:00.000Z',
        updatedAt: '2026-04-10T11:00:00.000Z',
      },
      {
        id: 3,
        baselineId: 1,
        code: 'PL-01',
        title: 'Pleito de paralisação e reequilíbrio por chuvas históricas',
        type: 'OTHER',
        status: 'SUBMITTED',
        requestedCostDelta: '950000.00',
        scheduleDeltaMonths: 1,
        description:
          'Custos de manutenção de canteiro e desmobilização provisória devido a cheias no Vale do Itajaí.',
        justification:
          'Boletins pluviométricos INMET e decretação de estado de calamidade regional.',
        wbsCodeAffected: '07.01',
        createdBy: 'juridico@engevix.com.br',
        createdAt: '2026-04-20T16:00:00.000Z',
        updatedAt: '2026-04-20T16:00:00.000Z',
      },
    ];

    this.changeOrders.set(1, seedOrders);
    this.nextId = 4;
  }

  async listByBaselineId(baselineId: number): Promise<ContractChangeOrder[]> {
    return this.changeOrders.get(baselineId) || [];
  }

  async findInBaseline(
    baselineId: number,
    changeOrderId: number,
  ): Promise<ContractChangeOrder | null> {
    const orders = this.changeOrders.get(baselineId) || [];
    return orders.find((o) => o.id === changeOrderId) ?? null;
  }

  async create(
    order: Omit<ContractChangeOrder, 'id' | 'code'> & { code?: string },
  ): Promise<ContractChangeOrder> {
    const orders = this.changeOrders.get(order.baselineId) || [];
    const id = this.nextId++;

    const stored: ContractChangeOrder = {
      ...order,
      id,
      code: order.code || `AD-${String(id).padStart(2, '0')}`,
    };

    orders.push(stored);
    this.changeOrders.set(order.baselineId, orders);
    return stored;
  }

  async save(order: ContractChangeOrder): Promise<ContractChangeOrder> {
    const orders = this.changeOrders.get(order.baselineId) || [];
    const index = orders.findIndex((o) => o.id === order.id);
    if (index >= 0) {
      orders[index] = order;
    } else {
      orders.push(order);
    }
    this.changeOrders.set(order.baselineId, orders);
    return order;
  }
}
