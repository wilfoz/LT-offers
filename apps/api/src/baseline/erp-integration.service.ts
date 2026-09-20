import { Injectable, NotFoundException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import {
  ErpIntegrationPackage,
  GenerateErpPackagePayload,
} from '@lt-offers/domain';
import { WbsGenerator } from '@lt-offers/calc-engine';
import { BaselineService } from './baseline.service';
import { PrismaService } from '../app/prisma.service';
import { AuditService } from '../audit/audit.service';

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF1E3A8A' }, // Navy Blue corporativo
};

const SUBHEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFE2E8F0' }, // Slate claro
};

const HEADER_FONT: Partial<ExcelJS.Font> = {
  name: 'Calibri',
  size: 11,
  bold: true,
  color: { argb: 'FFFFFFFF' },
};

const BORDER_THIN: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
};

const CURRENCY_FORMAT = 'R$ #,##0.00;[Red]-R$ #,##0.00;"-"';

@Injectable()
export class ErpIntegrationService {
  constructor(
    private readonly baselineService: BaselineService,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Gera o pacote canônico de dados em formato JSON estruturado (RF-10, Fase F7).
   */
  async generateErpJson(
    payload: GenerateErpPackagePayload,
    user: string,
  ): Promise<ErpIntegrationPackage> {
    const baseline = await this.baselineService.getBaselineById(
      payload.baselineId,
    );
    const offer = await this.prisma.offer.findUnique({
      where: { id: baseline.offerId },
    });

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
      generatedAt: new Date(),
    });

    // Auditoria
    this.auditService.logEvent({
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

  /**
   * Gera a planilha XLSX estruturada de carga para o ERP (SAP, TOTVS/RM, Sienge/Mega).
   */
  async generateErpXlsx(
    payload: GenerateErpPackagePayload,
    user: string,
  ): Promise<Buffer> {
    const erpPackage = await this.generateErpJson(payload, user);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'LT-Offers ERP Bridge Engine';
    workbook.created = new Date();

    // 1. Aba Resumo do Projeto
    const summarySheet = workbook.addWorksheet('Resumo do Projeto');
    summarySheet.columns = [
      { header: 'Propriedade', key: 'prop', width: 35 },
      { header: 'Valor / Configuração', key: 'val', width: 45 },
    ];
    summarySheet.getRow(1).eachCell((cell) => {
      cell.fill = HEADER_FILL;
      cell.font = HEADER_FONT;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    const summaryData = [
      { prop: 'Código da Oferta / Obra', val: erpPackage.offerCode },
      { prop: 'Nome do Empreendimento', val: erpPackage.offerName },
      { prop: 'Revisão Contratual', val: `R${erpPackage.revisionNumber}` },
      { prop: 'Sistema ERP Alvo', val: erpPackage.targetSystem },
      { prop: 'Código da Empresa / Coligada', val: erpPackage.companyCode },
      {
        prop: 'Data de Congelamento da Baseline',
        val: erpPackage.baselineFrozenAt,
      },
      { prop: 'Data de Geração do Pacote', val: erpPackage.generatedAt },
      { prop: 'Gerado por', val: erpPackage.generatedBy },
      {
        prop: 'Valor Total do Contrato (R$)',
        val: parseFloat(erpPackage.totalContractValue),
      },
      {
        prop: 'Custo Orçado Total (R$)',
        val: parseFloat(erpPackage.totalBudgetCost),
      },
      { prop: 'Moeda Padrão', val: erpPackage.currency },
    ];

    summaryData.forEach((row, idx) => {
      const addedRow = summarySheet.addRow(row);
      addedRow.eachCell((cell, colNumber) => {
        cell.border = BORDER_THIN;
        if (colNumber === 1) {
          cell.font = { bold: true };
          cell.fill = SUBHEADER_FILL;
        }
        if (colNumber === 2 && (idx === 8 || idx === 9)) {
          cell.numFmt = CURRENCY_FORMAT;
        }
      });
    });

    // 2. Aba Plano de Contas e Centros de Custo
    const accountsSheet = workbook.addWorksheet('Plano de Contas & Centros');
    accountsSheet.columns = [
      { header: 'Código EAP/WBS', key: 'wbs', width: 16 },
      { header: 'Centro de Custo ERP', key: 'cc', width: 24 },
      { header: 'Nome do Centro de Custo', key: 'ccName', width: 35 },
      { header: 'Conta Contábil Razão', key: 'gl', width: 22 },
      { header: 'Conta Orçamentária', key: 'orc', width: 22 },
      { header: 'Descrição do Pacote', key: 'desc', width: 45 },
      { header: 'Unidade', key: 'unit', width: 12 },
      { header: 'Custo Orçado Total (R$)', key: 'cost', width: 25 },
    ];

    accountsSheet.getRow(1).eachCell((cell) => {
      cell.fill = HEADER_FILL;
      cell.font = HEADER_FONT;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    for (const acc of erpPackage.accounts) {
      const row = accountsSheet.addRow({
        wbs: acc.wbsCode,
        cc: acc.costCenterCode,
        ccName: acc.costCenterName,
        gl: acc.generalLedgerAccount,
        orc: acc.budgetAccountCode,
        desc: acc.description,
        unit: acc.unit,
        cost: parseFloat(acc.totalBudgetedCost),
      });

      row.eachCell((cell, colNumber) => {
        cell.border = BORDER_THIN;
        if (colNumber === 8) {
          cell.numFmt = CURRENCY_FORMAT;
        }
      });
    }

    // 3. Aba Cronograma Mensal de Carga
    const scheduleSheet = workbook.addWorksheet('Cronograma Mensal ERP');
    scheduleSheet.columns = [
      { header: 'Mês', key: 'm', width: 10 },
      { header: 'Período (YYYY-MM)', key: 'period', width: 18 },
      { header: 'Centro de Custo', key: 'cc', width: 24 },
      { header: 'Código EAP', key: 'wbs', width: 16 },
      { header: 'Custo Previsto (R$)', key: 'cost', width: 22 },
      { header: 'Desembolso Previsto (R$)', key: 'disb', width: 25 },
      { header: 'Moeda', key: 'curr', width: 12 },
    ];

    scheduleSheet.getRow(1).eachCell((cell) => {
      cell.fill = HEADER_FILL;
      cell.font = HEADER_FONT;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    for (const item of erpPackage.monthlySchedule) {
      const row = scheduleSheet.addRow({
        m: item.monthNumber,
        period: item.periodDate,
        cc: item.costCenterCode,
        wbs: item.wbsCode,
        cost: parseFloat(item.plannedCostAmount),
        disb: parseFloat(item.plannedDisbursementAmount),
        curr: item.currency,
      });

      row.eachCell((cell, colNumber) => {
        cell.border = BORDER_THIN;
        if (colNumber === 5 || colNumber === 6) {
          cell.numFmt = CURRENCY_FORMAT;
        }
      });
    }

    const uint8 = await workbook.xlsx.writeBuffer();
    return Buffer.from(uint8);
  }
}
