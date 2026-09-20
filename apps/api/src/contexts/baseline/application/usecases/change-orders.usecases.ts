import { Inject, Injectable } from '@nestjs/common';
import {
  ContractChangeOrder,
  CreateChangeOrderPayload,
  CurrentWorkingEstimate,
  UpdateChangeOrderPayload,
} from '@lt-offers/domain';
import { ChangeOrderCalculator } from '@lt-offers/calc-engine';
import {
  AUDIT_TRAIL_PORT_TOKEN,
  AuditTrailPort,
  CHANGE_ORDERS_REPOSITORY_TOKEN,
  ChangeOrderNotFoundException,
  ChangeOrdersRepository,
} from '../../domain';
import { GetBaselineByIdUseCase } from './get-baselines.usecases';

@Injectable()
export class CreateChangeOrderUseCase {
  constructor(
    @Inject(CHANGE_ORDERS_REPOSITORY_TOKEN)
    private readonly changeOrders: ChangeOrdersRepository,
    @Inject(AUDIT_TRAIL_PORT_TOKEN)
    private readonly auditTrail: AuditTrailPort,
    private readonly getBaselineById: GetBaselineByIdUseCase,
  ) {}

  /**
   * Cria uma nova Ordem de Alteração Contratual / Pleito (Change Order).
   */
  async execute(
    payload: CreateChangeOrderPayload,
    user: string,
    createdAt: Date,
  ): Promise<ContractChangeOrder> {
    const baseline = await this.getBaselineById.execute(payload.baselineId);

    const newOrder = await this.changeOrders.create({
      baselineId: payload.baselineId,
      code: payload.code,
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
      createdAt: createdAt.toISOString(),
      updatedAt: createdAt.toISOString(),
    });

    // Auditoria
    this.auditTrail.logEvent({
      userId: user || 'user-contract',
      userName: user || 'Gestor de Contratos',
      userRole: 'COMMERCIAL',
      resource: 'OFFER',
      resourceId: String(baseline.offerId),
      offerId: String(baseline.offerId),
      action: 'CREATE',
      description: `Cadastro de Aditivo/Pleito ${newOrder.code} - ${newOrder.title} (Valor Solicitado: R$ ${newOrder.requestedCostDelta})`,
      diffs: [
        {
          field: 'changeOrderCode',
          previousValue: null,
          newValue: newOrder.code,
        },
        {
          field: 'requestedCostDelta',
          previousValue: null,
          newValue: newOrder.requestedCostDelta,
        },
      ],
    });

    return newOrder;
  }
}

@Injectable()
export class UpdateChangeOrderUseCase {
  constructor(
    @Inject(CHANGE_ORDERS_REPOSITORY_TOKEN)
    private readonly changeOrders: ChangeOrdersRepository,
    @Inject(AUDIT_TRAIL_PORT_TOKEN)
    private readonly auditTrail: AuditTrailPort,
  ) {}

  /**
   * Atualiza ou aprova uma Change Order.
   */
  async execute(
    baselineId: number,
    changeOrderId: number,
    payload: UpdateChangeOrderPayload,
    user: string,
    updatedAt: Date,
  ): Promise<ContractChangeOrder> {
    const existing = await this.changeOrders.findInBaseline(
      baselineId,
      changeOrderId,
    );
    if (!existing) {
      throw new ChangeOrderNotFoundException(changeOrderId, baselineId);
    }

    const isApproving =
      payload.status === 'APPROVED' && existing.status !== 'APPROVED';

    const updated: ContractChangeOrder = {
      ...existing,
      title: payload.title !== undefined ? payload.title : existing.title,
      type: payload.type !== undefined ? payload.type : existing.type,
      status: payload.status !== undefined ? payload.status : existing.status,
      requestedCostDelta:
        payload.requestedCostDelta !== undefined
          ? payload.requestedCostDelta
          : existing.requestedCostDelta,
      approvedCostDelta:
        payload.approvedCostDelta !== undefined
          ? payload.approvedCostDelta
          : existing.approvedCostDelta,
      scheduleDeltaMonths:
        payload.scheduleDeltaMonths !== undefined
          ? payload.scheduleDeltaMonths
          : existing.scheduleDeltaMonths,
      description:
        payload.description !== undefined
          ? payload.description
          : existing.description,
      justification:
        payload.justification !== undefined
          ? payload.justification
          : existing.justification,
      wbsCodeAffected:
        payload.wbsCodeAffected !== undefined
          ? payload.wbsCodeAffected
          : existing.wbsCodeAffected,
      approvedBy: isApproving
        ? payload.approvedBy || user || 'diretoria@cliente.com.br'
        : existing.approvedBy,
      approvedAt: isApproving ? updatedAt.toISOString() : existing.approvedAt,
      updatedAt: updatedAt.toISOString(),
    };

    await this.changeOrders.save(updated);

    // Auditoria — quirk herdado do legado: resourceId/offerId recebem o
    // baselineId (não o offerId real); preservado por paridade de eventos.
    this.auditTrail.logEvent({
      userId: user || 'user-admin',
      userName: user || 'Administrador',
      userRole: 'ADMIN',
      resource: 'OFFER',
      resourceId: String(baselineId),
      offerId: String(baselineId),
      action: 'UPDATE',
      description: `Atualização de Aditivo/Pleito ${updated.code} - Status: ${updated.status}`,
      diffs: [
        {
          field: 'status',
          previousValue: existing.status,
          newValue: updated.status,
        },
        {
          field: 'approvedCostDelta',
          previousValue: existing.approvedCostDelta,
          newValue: updated.approvedCostDelta,
        },
      ],
    });

    return updated;
  }
}

@Injectable()
export class ListChangeOrdersUseCase {
  constructor(
    @Inject(CHANGE_ORDERS_REPOSITORY_TOKEN)
    private readonly changeOrders: ChangeOrdersRepository,
  ) {}

  async execute(baselineId: number): Promise<ContractChangeOrder[]> {
    return this.changeOrders.listByBaselineId(baselineId);
  }
}

@Injectable()
export class GetCurrentWorkingEstimateUseCase {
  constructor(
    @Inject(CHANGE_ORDERS_REPOSITORY_TOKEN)
    private readonly changeOrders: ChangeOrdersRepository,
    private readonly getBaselineById: GetBaselineByIdUseCase,
  ) {}

  /**
   * Calcula e retorna a Projeção do Current Working Estimate (CWE).
   */
  async execute(baselineId: number): Promise<CurrentWorkingEstimate> {
    const baseline = await this.getBaselineById.execute(baselineId);
    const orders = await this.changeOrders.listByBaselineId(baselineId);

    return ChangeOrderCalculator.calculateCwe({
      baseline,
      changeOrders: orders,
    });
  }
}
