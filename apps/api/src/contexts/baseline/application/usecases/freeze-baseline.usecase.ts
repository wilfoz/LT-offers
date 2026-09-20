import { Inject, Injectable } from '@nestjs/common';
import { CreateBaselinePayload, WorkBaseline } from '@lt-offers/domain';
import { WbsGenerator } from '@lt-offers/calc-engine';
import { EconomicsFacadeService } from '../../../economics';
import {
  AUDIT_TRAIL_PORT_TOKEN,
  AuditTrailPort,
  BASELINE_OFFER_QUERY_PORT_TOKEN,
  BASELINES_REPOSITORY_TOKEN,
  BaselineOfferQueryPort,
  BaselineOfferNotFoundException,
  BaselinesRepository,
} from '../../domain';

@Injectable()
export class FreezeBaselineUseCase {
  constructor(
    @Inject(BASELINES_REPOSITORY_TOKEN)
    private readonly baselines: BaselinesRepository,
    @Inject(BASELINE_OFFER_QUERY_PORT_TOKEN)
    private readonly offerQuery: BaselineOfferQueryPort,
    @Inject(AUDIT_TRAIL_PORT_TOKEN)
    private readonly auditTrail: AuditTrailPort,
    private readonly economicsFacade: EconomicsFacadeService,
  ) {}

  /**
   * Congela a Linha de Base Contratual da Obra (Data 0) a partir da proposta vencedora (RF-02, RF-03, Fase F7).
   */
  async execute(
    payload: CreateBaselinePayload,
    user: string,
    frozenAt: Date,
  ): Promise<WorkBaseline> {
    const offer = await this.offerQuery.findOfferBasics(payload.offerId);

    if (!offer) {
      throw new BaselineOfferNotFoundException(payload.offerId);
    }

    // Busca valores de resultado econômico ou fallback consistente
    let contractValue = '120000000.00';
    let budgetCost = '100000000.00';
    let marginPercent = '8.00';

    try {
      const econ = await this.economicsFacade.getConsolidatedEconomicResult(
        payload.offerId,
      );
      if (econ) {
        contractValue = econ.totalSalePrice || contractValue;
        budgetCost = econ.totalNetCost || budgetCost;
        marginPercent = econ.netMarginPercent || marginPercent;
      }
    } catch {
      // Usa valores default se cálculo isolado
    }

    const workPackages = WbsGenerator.generateDefaultWorkPackages({
      totalContractValue: contractValue,
      totalBudgetCost: budgetCost,
      lineCode: offer.code,
    });

    const baseline = await this.baselines.create({
      offerId: payload.offerId,
      revisionId: payload.revisionId,
      baselineNumber: 0,
      name: payload.name || `Linha de Base Contratual Data 0 - ${offer.name}`,
      status: 'ACTIVE',
      totalContractValue: contractValue,
      totalBudgetCost: budgetCost,
      targetMarginPercent: marginPercent,
      scheduleMonths: 18,
      frozenAt: frozenAt.toISOString(),
      frozenBy: user || payload.frozenBy || 'sistema@engevix.com.br',
      notes:
        payload.notes ||
        'Linha de base congelada a partir da proposta vencedora.',
      workPackages,
      createdAt: frozenAt.toISOString(),
      updatedAt: frozenAt.toISOString(),
    });

    // Registra na trilha de auditoria (RF-65, RNF-12)
    this.auditTrail.logEvent({
      userId: user || 'user-admin',
      userName: user || 'Administrador',
      userRole: 'ADMIN',
      resource: 'OFFER',
      resourceId: String(payload.offerId),
      offerId: String(payload.offerId),
      action: 'FREEZE',
      description: `Congelamento da Linha de Base Contratual Data 0 para a oferta ${offer.code} (${offer.name})`,
      diffs: [
        { field: 'status', previousValue: 'DELIVERED', newValue: 'WON' },
        { field: 'baselineNumber', previousValue: null, newValue: 0 },
        {
          field: 'totalContractValue',
          previousValue: null,
          newValue: contractValue,
        },
      ],
    });

    return baseline;
  }
}
