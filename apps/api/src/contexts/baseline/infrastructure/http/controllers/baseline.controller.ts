import {
  Body,
  Controller,
  Get,
  NotFoundException,
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
  GenerateErpPackagePayload,
  MonthlyProgressRecord,
  RecordMonthlyProgressPayload,
  UpdateChangeOrderPayload,
  WorkBaseline,
} from '@lt-offers/domain';
import { RolesGuard } from '../../../../../auth/roles.guard';
import { Roles } from '../../../../../auth/auth.decorators';
import {
  BaselineNotFoundException,
  BaselineOfferNotFoundException,
  ChangeOrderNotFoundException,
  NoActiveBaselineException,
} from '../../../domain';
import {
  FreezeBaselineUseCase,
  GetActiveBaselineUseCase,
  CreateChangeOrderUseCase,
  UpdateChangeOrderUseCase,
  ListChangeOrdersUseCase,
  GetCurrentWorkingEstimateUseCase,
  RecordMonthlyProgressUseCase,
  GetCurveSUseCase,
  ListProgressRecordsUseCase,
  GenerateErpJsonUseCase,
  GenerateErpXlsxUseCase,
} from '../../../application';

function toHttp(err: unknown): unknown {
  if (
    err instanceof BaselineNotFoundException ||
    err instanceof NoActiveBaselineException ||
    err instanceof BaselineOfferNotFoundException ||
    err instanceof ChangeOrderNotFoundException
  ) {
    return new NotFoundException(err.message);
  }
  return err;
}

@Controller('offers/:offerId')
@UseGuards(RolesGuard)
export class BaselineController {
  constructor(
    private readonly freezeBaselineUseCase: FreezeBaselineUseCase,
    private readonly getActiveBaselineUseCase: GetActiveBaselineUseCase,
    private readonly createChangeOrderUseCase: CreateChangeOrderUseCase,
    private readonly updateChangeOrderUseCase: UpdateChangeOrderUseCase,
    private readonly listChangeOrdersUseCase: ListChangeOrdersUseCase,
    private readonly getCweUseCase: GetCurrentWorkingEstimateUseCase,
    private readonly recordProgressUseCase: RecordMonthlyProgressUseCase,
    private readonly getCurveSUseCase: GetCurveSUseCase,
    private readonly listProgressUseCase: ListProgressRecordsUseCase,
    private readonly generateErpJsonUseCase: GenerateErpJsonUseCase,
    private readonly generateErpXlsxUseCase: GenerateErpXlsxUseCase,
  ) {}

  /**
   * Obtém a linha de base contratual ativa de uma oferta (Fase F7).
   */
  @Get('baseline')
  async getBaseline(
    @Param('offerId', ParseIntPipe) offerId: number,
  ): Promise<WorkBaseline> {
    try {
      return await this.getActiveBaselineUseCase.execute(offerId);
    } catch (err) {
      throw toHttp(err);
    }
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
    try {
      return await this.freezeBaselineUseCase.execute(
        {
          offerId,
          revisionId: payload.revisionId || 1,
          name: payload.name,
          frozenBy: payload.frozenBy || 'diretoria.comercial@engevix.com.br',
          notes: payload.notes,
        },
        payload.frozenBy || 'diretoria.comercial@engevix.com.br',
        new Date(),
      );
    } catch (err) {
      throw toHttp(err);
    }
  }

  /**
   * Obtém os dados de Curva S (Previsto vs. Realizado) e indicadores EVM.
   */
  @Get('curve-s')
  async getCurveS(
    @Param('offerId', ParseIntPipe) offerId: number,
    @Query('baselineId') baselineId?: string,
  ): Promise<CurveSData> {
    try {
      return await this.getCurveSUseCase.execute(
        offerId,
        new Date(),
        baselineId ? parseInt(baselineId, 10) : undefined,
      );
    } catch (err) {
      throw toHttp(err);
    }
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
    try {
      return await this.recordProgressUseCase.execute(
        payload,
        payload.createdBy || 'eng.campo@engevix.com.br',
        new Date(),
      );
    } catch (err) {
      throw toHttp(err);
    }
  }

  /**
   * Lista os boletins de medição de uma baseline.
   */
  @Get('progress-records')
  async listProgressRecords(
    @Param('offerId', ParseIntPipe) offerId: number,
    @Query('baselineId') baselineId?: string,
  ): Promise<MonthlyProgressRecord[]> {
    try {
      const bId = baselineId
        ? parseInt(baselineId, 10)
        : (await this.getActiveBaselineUseCase.execute(offerId)).id;
      return await this.listProgressUseCase.execute(bId);
    } catch (err) {
      throw toHttp(err);
    }
  }

  /**
   * Lista as ordens de alteração contratual (aditivos e pleitos) da baseline.
   */
  @Get('change-orders')
  async listChangeOrders(
    @Param('offerId', ParseIntPipe) offerId: number,
    @Query('baselineId') baselineId?: string,
  ): Promise<ContractChangeOrder[]> {
    try {
      const bId = baselineId
        ? parseInt(baselineId, 10)
        : (await this.getActiveBaselineUseCase.execute(offerId)).id;
      return await this.listChangeOrdersUseCase.execute(bId);
    } catch (err) {
      throw toHttp(err);
    }
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
    try {
      return await this.createChangeOrderUseCase.execute(
        payload,
        payload.createdBy || 'gestor.contrato@engevix.com.br',
        new Date(),
      );
    } catch (err) {
      throw toHttp(err);
    }
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
    try {
      const bId =
        payload.baselineId ||
        (await this.getActiveBaselineUseCase.execute(offerId)).id;
      return await this.updateChangeOrderUseCase.execute(
        bId,
        changeOrderId,
        payload,
        payload.approvedBy || 'diretor.comercial@engevix.com.br',
        new Date(),
      );
    } catch (err) {
      throw toHttp(err);
    }
  }

  /**
   * Obtém a estimativa corrente consolidada (Current Working Estimate - CWE).
   */
  @Get('cwe')
  async getCurrentWorkingEstimate(
    @Param('offerId', ParseIntPipe) offerId: number,
    @Query('baselineId') baselineId?: string,
  ): Promise<CurrentWorkingEstimate> {
    try {
      const bId = baselineId
        ? parseInt(baselineId, 10)
        : (await this.getActiveBaselineUseCase.execute(offerId)).id;
      return await this.getCweUseCase.execute(bId);
    } catch (err) {
      throw toHttp(err);
    }
  }

  /**
   * Gera o pacote de integração ERP em formato JSON.
   */
  @Post('erp-package')
  async generateErpPackageJson(
    @Param('offerId', ParseIntPipe) offerId: number,
    @Body() payload: Partial<GenerateErpPackagePayload>,
  ): Promise<ErpIntegrationPackage> {
    try {
      const bId =
        payload.baselineId ||
        (await this.getActiveBaselineUseCase.execute(offerId)).id;
      return await this.generateErpJsonUseCase.execute(
        {
          baselineId: bId,
          targetSystem: payload.targetSystem || 'SAP',
          companyCode: payload.companyCode,
          generatedBy: payload.generatedBy || 'controladoria@engevix.com.br',
        },
        payload.generatedBy || 'controladoria@engevix.com.br',
        new Date(),
      );
    } catch (err) {
      throw toHttp(err);
    }
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
    try {
      const bId =
        payload.baselineId ||
        (await this.getActiveBaselineUseCase.execute(offerId)).id;
      const targetSystem = payload.targetSystem || 'SAP';
      const buffer = await this.generateErpXlsxUseCase.execute(
        {
          baselineId: bId,
          targetSystem,
          companyCode: payload.companyCode,
          generatedBy: payload.generatedBy || 'controladoria@engevix.com.br',
        },
        payload.generatedBy || 'controladoria@engevix.com.br',
        new Date(),
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
    } catch (err) {
      throw toHttp(err);
    }
  }
}
