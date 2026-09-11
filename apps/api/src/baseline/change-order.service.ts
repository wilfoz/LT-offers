import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ChangeOrderStatus,
  ContractChangeOrder,
  CreateChangeOrderPayload,
  CurrentWorkingEstimate,
  UpdateChangeOrderPayload,
} from '@lt-offers/domain';
import { ChangeOrderCalculator } from '@lt-offers/calc-engine';
import { BaselineService } from './baseline.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ChangeOrderService {
  private changeOrders: Map<number, ContractChangeOrder[]> = new Map(); // baselineId -> changeOrders
  private nextId = 1;

  constructor(
    private readonly baselineService: BaselineService,
    private readonly auditService: AuditService,
  ) {
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
        description: 'Substituição de fundações tubulão por estacas raiz com injeção de calda de cimento em rocha branda.',
        justification: 'Relatório de sondagens rotativas complementares SRLT-02.',
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
        description: 'Instalação de estrutura estaiada tipo E-30 adicional para garantir vão de segurança exigido pela TBG.',
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
        description: 'Custos de manutenção de canteiro e desmobilização provisória devido a cheias no Vale do Itajaí.',
        justification: 'Boletins pluviométricos INMET e decretação de estado de calamidade regional.',
        wbsCodeAffected: '07.01',
        createdBy: 'juridico@engevix.com.br',
        createdAt: '2026-04-20T16:00:00.000Z',
        updatedAt: '2026-04-20T16:00:00.000Z',
      },
    ];

    this.changeOrders.set(1, seedOrders);
    this.nextId = 4;
  }

  /**
   * Cria uma nova Ordem de Alteração Contratual / Pleito (Change Order).
   */
  async createChangeOrder(
    payload: CreateChangeOrderPayload,
    user: string,
  ): Promise<ContractChangeOrder> {
    const baseline = await this.baselineService.getBaselineById(payload.baselineId);
    if (!baseline) {
      throw new NotFoundException(`Linha de Base ID ${payload.baselineId} não encontrada.`);
    }

    const orders = this.changeOrders.get(payload.baselineId) || [];
    const id = this.nextId++;

    const newOrder: ContractChangeOrder = {
      id,
      baselineId: payload.baselineId,
      code: payload.code || `AD-${String(id).padStart(2, '0')}`,
      title: payload.title,
      type: payload.type,
      status: payload.status || 'DRAFT',
      requestedCostDelta: payload.requestedCostDelta,
      approvedCostDelta: payload.approvedCostDelta || null,
      scheduleDeltaMonths: payload.scheduleDeltaMonths || 0,
      description: payload.description,
      justification: payload.justification,
      wbsCodeAffected: payload.wbsCodeAffected || null,
      createdBy: user || payload.createdBy || 'gestor.contrato@engevix.com.br',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    orders.push(newOrder);
    this.changeOrders.set(payload.baselineId, orders);

    // Auditoria
    this.auditService.logEvent({
      userId: user || 'user-contract',
      userName: user || 'Gestor de Contratos',
      userRole: 'COMMERCIAL',
      resource: 'OFFER',
      resourceId: String(baseline.offerId),
      offerId: String(baseline.offerId),
      action: 'CREATE',
      description: `Cadastro de Aditivo/Pleito ${newOrder.code} - ${newOrder.title} (Valor Solicitado: R$ ${newOrder.requestedCostDelta})`,
      diffs: [
        { field: 'changeOrderCode', previousValue: null, newValue: newOrder.code },
        { field: 'requestedCostDelta', previousValue: null, newValue: newOrder.requestedCostDelta },
      ],
    });

    return newOrder;
  }

  /**
   * Atualiza ou aprova uma Change Order.
   */
  async updateChangeOrder(
    baselineId: number,
    changeOrderId: number,
    payload: UpdateChangeOrderPayload,
    user: string,
  ): Promise<ContractChangeOrder> {
    const orders = this.changeOrders.get(baselineId) || [];
    const index = orders.findIndex((o) => o.id === changeOrderId);
    if (index === -1) {
      throw new NotFoundException(`Change Order ID ${changeOrderId} não encontrada na baseline ${baselineId}.`);
    }

    const existing = orders[index];
    const isApproving = payload.status === 'APPROVED' && existing.status !== 'APPROVED';

    const updated: ContractChangeOrder = {
      ...existing,
      title: payload.title !== undefined ? payload.title : existing.title,
      type: payload.type !== undefined ? payload.type : existing.type,
      status: payload.status !== undefined ? payload.status : existing.status,
      requestedCostDelta: payload.requestedCostDelta !== undefined ? payload.requestedCostDelta : existing.requestedCostDelta,
      approvedCostDelta: payload.approvedCostDelta !== undefined ? payload.approvedCostDelta : existing.approvedCostDelta,
      scheduleDeltaMonths: payload.scheduleDeltaMonths !== undefined ? payload.scheduleDeltaMonths : existing.scheduleDeltaMonths,
      description: payload.description !== undefined ? payload.description : existing.description,
      justification: payload.justification !== undefined ? payload.justification : existing.justification,
      wbsCodeAffected: payload.wbsCodeAffected !== undefined ? payload.wbsCodeAffected : existing.wbsCodeAffected,
      approvedBy: isApproving ? (payload.approvedBy || user || 'diretoria@cliente.com.br') : existing.approvedBy,
      approvedAt: isApproving ? new Date().toISOString() : existing.approvedAt,
      updatedAt: new Date().toISOString(),
    };

    orders[index] = updated;
    this.changeOrders.set(baselineId, orders);

    // Auditoria
    this.auditService.logEvent({
      userId: user || 'user-admin',
      userName: user || 'Administrador',
      userRole: 'ADMIN',
      resource: 'OFFER',
      resourceId: String(baselineId),
      offerId: String(baselineId),
      action: 'UPDATE',
      description: `Atualização de Aditivo/Pleito ${updated.code} - Status: ${updated.status}`,
      diffs: [
        { field: 'status', previousValue: existing.status, newValue: updated.status },
        { field: 'approvedCostDelta', previousValue: existing.approvedCostDelta, newValue: updated.approvedCostDelta },
      ],
    });

    return updated;
  }

  /**
   * Lista todos os aditivos e pleitos de uma baseline.
   */
  async listChangeOrders(baselineId: number): Promise<ContractChangeOrder[]> {
    return this.changeOrders.get(baselineId) || [];
  }

  /**
   * Calcula e retorna a Projeção do Current Working Estimate (CWE).
   */
  async getCurrentWorkingEstimate(baselineId: number): Promise<CurrentWorkingEstimate> {
    const baseline = await this.baselineService.getBaselineById(baselineId);
    const orders = this.changeOrders.get(baselineId) || [];

    return ChangeOrderCalculator.calculateCwe({
      baseline,
      changeOrders: orders,
    });
  }
}
