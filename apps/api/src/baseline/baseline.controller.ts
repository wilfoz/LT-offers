import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ContractChangeOrder,
  CreateBaselinePayload,
  CreateChangeOrderPayload,
  CurrentWorkingEstimate,
  CurveSData,
  ErpIntegrationPackage,
  ErpTargetSystem,
  GenerateErpPackagePayload,
  MonthlyProgressRecord,
  RecordMonthlyProgressPayload,
  UpdateChangeOrderPayload,
  WorkBaseline,
} from '@lt-offers/domain';
import { BaselineService } from './baseline.service';
import { ProgressTrackingService } from './progress-tracking.service';
import { ChangeOrderService } from './change-order.service';
import { ErpIntegrationService } from './erp-integration.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/auth.decorators';

@Controller('offers/:offerId')
@UseGuards(RolesGuard)
export class BaselineController {
  constructor(
    private readonly baselineService: BaselineService,
    private readonly progressTrackingService: ProgressTrackingService,
    private readonly changeOrderService: ChangeOrderService,
    private readonly erpIntegrationService: ErpIntegrationService,
  ) {}

  /**
   * Obtém a linha de base contratual ativa de uma oferta (Fase F7).
   */
  @Get('baseline')
  async getBaseline(
    @Param('offerId', ParseIntPipe) offerId: number,
  ): Promise<WorkBaseline> {
    return this.baselineService.getActiveBaseline(offerId);
  }

  /**
   * Congela a linha de base contratual (Data 0) da proposta vencedora.
   */
  @Post('baseline/freeze')
  @Roles('ADMIN', 'COMMERCIAL')
  async freezeBaseline(
    @Param('offerId', ParseIntPipe) offerId: number,
    @Body() payload: Partial<CreateBaselinePayload>,
  ): Promise<WorkBaseline> {
    return this.baselineService.freezeBaseline(
      {
        offerId,
        revisionId: payload.revisionId || 1,
        name: payload.name,
        frozenBy: payload.frozenBy || 'diretoria.comercial@engevix.com.br',
        notes: payload.notes,
      },
      payload.frozenBy || 'diretoria.comercial@engevix.com.br',
    );
  }

  /**
   * Obtém os dados de Curva S (Previsto vs. Realizado) e indicadores EVM.
   */
  @Get('curve-s')
  async getCurveS(
    @Param('offerId', ParseIntPipe) offerId: number,
    @Query('baselineId') baselineId?: string,
  ): Promise<CurveSData> {
    return this.progressTrackingService.getCurveS(
      offerId,
      baselineId ? parseInt(baselineId, 10) : undefined,
    );
  }

  /**
   * Lança um boletim de medição mensal de avanço físico-financeiro.
   */
  @Post('progress-records')
  @Roles('ADMIN', 'ENGINEERING', 'COMMERCIAL')
  async recordMonthlyProgress(
    @Param('offerId', ParseIntPipe) offerId: number,
    @Body() payload: RecordMonthlyProgressPayload,
  ): Promise<MonthlyProgressRecord> {
    return this.progressTrackingService.recordMonthlyProgress(
      payload,
      payload.createdBy || 'eng.campo@engevix.com.br',
    );
  }

  /**
   * Lista os boletins de medição de uma baseline.
   */
  @Get('progress-records')
  async listProgressRecords(
    @Param('offerId', ParseIntPipe) offerId: number,
    @Query('baselineId') baselineId?: string,
  ): Promise<MonthlyProgressRecord[]> {
    const bId = baselineId ? parseInt(baselineId, 10) : (await this.baselineService.getActiveBaseline(offerId)).id;
    return this.progressTrackingService.listProgressRecords(bId);
  }

  /**
   * Lista as ordens de alteração contratual (aditivos e pleitos) da baseline.
   */
  @Get('change-orders')
  async listChangeOrders(
    @Param('offerId', ParseIntPipe) offerId: number,
    @Query('baselineId') baselineId?: string,
  ): Promise<ContractChangeOrder[]> {
    const bId = baselineId ? parseInt(baselineId, 10) : (await this.baselineService.getActiveBaseline(offerId)).id;
    return this.changeOrderService.listChangeOrders(bId);
  }

  /**
   * Cadastra uma nova ordem de alteração / pleito (Change Order).
   */
  @Post('change-orders')
  @Roles('ADMIN', 'COMMERCIAL', 'ENGINEERING')
  async createChangeOrder(
    @Param('offerId', ParseIntPipe) offerId: number,
    @Body() payload: CreateChangeOrderPayload,
  ): Promise<ContractChangeOrder> {
    return this.changeOrderService.createChangeOrder(
      payload,
      payload.createdBy || 'gestor.contrato@engevix.com.br',
    );
  }

  /**
   * Atualiza ou aprova uma Change Order.
   */
  @Put('change-orders/:changeOrderId')
  @Roles('ADMIN', 'COMMERCIAL')
  async updateChangeOrder(
    @Param('offerId', ParseIntPipe) offerId: number,
    @Param('changeOrderId', ParseIntPipe) changeOrderId: number,
    @Body() payload: UpdateChangeOrderPayload & { baselineId?: number },
  ): Promise<ContractChangeOrder> {
    const bId = payload.baselineId || (await this.baselineService.getActiveBaseline(offerId)).id;
    return this.changeOrderService.updateChangeOrder(
      bId,
      changeOrderId,
      payload,
      payload.approvedBy || 'diretor.comercial@engevix.com.br',
    );
  }

  /**
   * Obtém a estimativa corrente consolidada (Current Working Estimate - CWE).
   */
  @Get('cwe')
  async getCurrentWorkingEstimate(
    @Param('offerId', ParseIntPipe) offerId: number,
    @Query('baselineId') baselineId?: string,
  ): Promise<CurrentWorkingEstimate> {
    const bId = baselineId ? parseInt(baselineId, 10) : (await this.baselineService.getActiveBaseline(offerId)).id;
    return this.changeOrderService.getCurrentWorkingEstimate(bId);
  }

  /**
   * Gera o pacote de integração ERP em formato JSON.
   */
  @Post('erp-package')
  async generateErpPackageJson(
    @Param('offerId', ParseIntPipe) offerId: number,
    @Body() payload: Partial<GenerateErpPackagePayload>,
  ): Promise<ErpIntegrationPackage> {
    const bId = payload.baselineId || (await this.baselineService.getActiveBaseline(offerId)).id;
    return this.erpIntegrationService.generateErpJson(
      {
        baselineId: bId,
        targetSystem: payload.targetSystem || 'SAP',
        companyCode: payload.companyCode,
        generatedBy: payload.generatedBy || 'controladoria@engevix.com.br',
      },
      payload.generatedBy || 'controladoria@engevix.com.br',
    );
  }

  /**
   * Exporta a planilha XLSX formatada para importação direta no ERP (SAP, TOTVS/RM, Sienge/Mega).
   */
  @Post('erp-package/export-xlsx')
  async exportErpPackageXlsx(
    @Param('offerId', ParseIntPipe) offerId: number,
    @Body() payload: Partial<GenerateErpPackagePayload>,
    @Res() res: Response,
  ): Promise<void> {
    const bId = payload.baselineId || (await this.baselineService.getActiveBaseline(offerId)).id;
    const targetSystem = payload.targetSystem || 'SAP';
    const buffer = await this.erpIntegrationService.generateErpXlsx(
      {
        baselineId: bId,
        targetSystem,
        companyCode: payload.companyCode,
        generatedBy: payload.generatedBy || 'controladoria@engevix.com.br',
      },
      payload.generatedBy || 'controladoria@engevix.com.br',
    );

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Carga_ERP_${targetSystem}_Oferta_${offerId}.xlsx"`,
    );
    res.send(buffer);
  }
}
