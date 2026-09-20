import { Inject, Injectable } from '@nestjs/common';
import {
  ErpIntegrationPackage,
  GenerateErpPackagePayload,
} from '@lt-offers/domain';
import { WbsGenerator } from '@lt-offers/calc-engine';
import {
  AUDIT_TRAIL_PORT_TOKEN,
  AuditTrailPort,
  BASELINE_OFFER_QUERY_PORT_TOKEN,
  BaselineOfferQueryPort,
  ERP_SPREADSHEET_PORT_TOKEN,
  ErpSpreadsheetPort,
} from '../../domain';
import { GetBaselineByIdUseCase } from './get-baselines.usecases';

@Injectable()
export class GenerateErpJsonUseCase {
  constructor(
    @Inject(BASELINE_OFFER_QUERY_PORT_TOKEN)
    private readonly offerQuery: BaselineOfferQueryPort,
    @Inject(AUDIT_TRAIL_PORT_TOKEN)
    private readonly auditTrail: AuditTrailPort,
    private readonly getBaselineById: GetBaselineByIdUseCase,
  ) {}

  /**
   * Gera o pacote canônico de dados em formato JSON estruturado (RF-10, Fase F7).
   */
  async execute(
    payload: GenerateErpPackagePayload,
    user: string,
    generatedAt: Date,
  ): Promise<ErpIntegrationPackage> {
    const baseline = await this.getBaselineById.execute(payload.baselineId);
    const offer = await this.offerQuery.findOfferBasics(baseline.offerId);

    const offerCode = offer ? offer.code : `OFR-${baseline.offerId}`;
    const offerName = offer ? offer.name : baseline.name;

    const erpPackage = WbsGenerator.generateErpPackage({
      baseline,
      offerCode,
      offerName,
      revisionNumber: baseline.baselineNumber,
      targetSystem: payload.targetSystem,
      companyCode: payload.companyCode,
      generatedBy:
        user || payload.generatedBy || 'controladoria@engevix.com.br',
      generatedAt,
    });

    // Auditoria
    this.auditTrail.logEvent({
      userId: user || 'user-controller',
      userName: user || 'Controladoria & ERP',
      userRole: 'COMMERCIAL',
      resource: 'OFFER',
      resourceId: String(baseline.offerId),
      offerId: String(baseline.offerId),
      action: 'EXPORT',
      description: `Geração do Pacote de Carga ERP para sistema ${payload.targetSystem} (Oferta: ${offerCode})`,
    });

    return erpPackage;
  }
}

@Injectable()
export class GenerateErpXlsxUseCase {
  constructor(
    @Inject(ERP_SPREADSHEET_PORT_TOKEN)
    private readonly spreadsheet: ErpSpreadsheetPort,
    private readonly generateErpJson: GenerateErpJsonUseCase,
  ) {}

  /**
   * Gera a planilha XLSX estruturada de carga para o ERP (SAP, TOTVS/RM, Sienge/Mega).
   */
  async execute(
    payload: GenerateErpPackagePayload,
    user: string,
    generatedAt: Date,
  ): Promise<Buffer> {
    const erpPackage = await this.generateErpJson.execute(
      payload,
      user,
      generatedAt,
    );
    return this.spreadsheet.buildWorkbook(erpPackage);
  }
}
