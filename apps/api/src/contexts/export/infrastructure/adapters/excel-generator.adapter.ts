import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import {
  TenderSheetExportData,
  MeasurementSheetExportData,
  CashflowExportData,
} from '@lt-offers/domain';
import { SpreadsheetGeneratorPort } from '../../domain';

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF1E3A8A' }, // Navy Blue corporativo
};

const GROUP_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFE2E8F0' }, // Slate claro
};

const TOTAL_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFDBEAFE' }, // Azul suave
};

const PEAK_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFFEE2E2' }, // Vermelho claro / destaque
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
const PERCENT_FORMAT = '0.00%';
const NUMBER_FORMAT = '#,##0.00';

@Injectable()
export class ExcelGeneratorAdapter implements SpreadsheetGeneratorPort {
  /**
   * Gera a Planilha de Preços do Edital em formato XLSX (RF-47, RF-50, RNF-11).
   */
  async generateTenderSheet(data: TenderSheetExportData): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'LT-Offers Engine';
    workbook.created = new Date();

    const sheetName =
      data.layout === 'CELEO_STANDARD'
        ? 'Planilha Precos Celeo'
        : data.layout === 'ANEEL_STANDARD'
          ? 'Planilha Edital ANEEL'
          : 'Planilha de Precos EPC';

    const worksheet = workbook.addWorksheet(sheetName, {
      views: [{ showGridLines: true }],
    });

    // 1. Bloco de Título / Metadados
    worksheet.mergeCells('A1:I1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `PLANILHA DE PREÇOS DO EDITAL - ${data.offerName.toUpperCase()}`;
    titleCell.font = {
      name: 'Calibri',
      size: 14,
      bold: true,
      color: { argb: 'FF1E3A8A' },
    };
    titleCell.alignment = { horizontal: 'left', vertical: 'middle' };
    worksheet.getRow(1).height = 26;

    worksheet.getCell('A2').value =
      `Oferta ID: ${data.offerId} | Revisão: R${data.revisionNumber} | Layout: ${data.layout} | Data de Emissão: ${new Date(data.generatedAt).toLocaleString('pt-BR')}`;
    worksheet.getCell('A2').font = {
      name: 'Calibri',
      size: 10,
      italic: true,
      color: { argb: 'FF6B7280' },
    };
    worksheet.getRow(2).height = 18;

    // 2. Cabeçalho das Colunas
    let headers: string[];
    if (data.layout === 'CELEO_STANDARD') {
      headers = [
        'Código CIP / Conta',
        'Discriminação do Fornecimento / Serviço',
        'UM',
        'Quantidade',
        'Custo Direto Unit. (R$)',
        'Custo Direto Total (R$)',
        'BDI (%)',
        'Preço Unitário (R$)',
        'Preço Total de Venda (R$)',
      ];
    } else if (data.layout === 'ANEEL_STANDARD') {
      headers = [
        'Código CIP',
        'Descrição dos Itens do Leilão',
        'Unid.',
        'Qtd.',
        'Custo Direto Unit. (R$)',
        'Custo Direto Total (R$)',
        'BDI (%)',
        'Preço Unit. Venda (R$)',
        'Preço Total Venda (R$)',
      ];
    } else {
      headers = [
        'Código CIP',
        'Descrição do Item / Subitem',
        'Unidade',
        'Quantidade',
        'Custo Direto Unitário (R$)',
        'Custo Direto Total (R$)',
        'BDI (%)',
        'Preço Unitário Venda (R$)',
        'Preço Total Venda (R$)',
      ];
    }

    const headerRow = worksheet.getRow(4);
    headerRow.values = headers;
    headerRow.height = 24;
    headerRow.eachCell((cell) => {
      cell.fill = HEADER_FILL;
      cell.font = HEADER_FONT;
      cell.alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true,
      };
      cell.border = BORDER_THIN;
    });

    // 3. Linhas de Dados
    let rowIndex = 5;
    for (const row of data.rows) {
      const currentRow = worksheet.getRow(rowIndex);
      const isGroupHeader = row.level === 1 || !row.cipCode;
      const isTotalRow = row.isTotal;

      const qty = Number(row.quantity) || 0;
      const directUnit = Number(row.directUnitCost) || 0;
      const directTotal = Number(row.directTotalCost) || 0;
      const bdi = (Number(row.bdiRate) || 0) / 100;
      const unitPrice = Number(row.unitPrice) || 0;
      const totalPrice = Number(row.totalPrice) || 0;

      currentRow.values = [
        row.cipCode || '',
        row.description,
        row.unit || '',
        qty > 0 ? qty : '',
        directUnit > 0 ? directUnit : '',
        directTotal > 0 ? directTotal : '',
        bdi > 0 ? bdi : '',
        unitPrice > 0 ? unitPrice : '',
        totalPrice > 0 ? totalPrice : '',
      ];

      currentRow.height = 20;

      currentRow.eachCell((cell, colNumber) => {
        cell.border = BORDER_THIN;
        cell.font = {
          name: 'Calibri',
          size: 10,
          bold: isGroupHeader || isTotalRow,
        };

        if (isGroupHeader) {
          cell.fill = GROUP_FILL;
        } else if (isTotalRow) {
          cell.fill = TOTAL_FILL;
        }

        // Alinhamento e formatação por coluna
        if (colNumber === 1 || colNumber === 3) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else if (colNumber === 2) {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        } else if (colNumber === 4) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = NUMBER_FORMAT;
        } else if (colNumber === 7) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = PERCENT_FORMAT;
        } else {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = CURRENCY_FORMAT;
        }
      });

      rowIndex++;
    }

    // 4. Largura das colunas
    worksheet.columns = [
      { key: 'cip', width: 16 },
      { key: 'desc', width: 45 },
      { key: 'unit', width: 10 },
      { key: 'qty', width: 14 },
      { key: 'unitCost', width: 22 },
      { key: 'totalCost', width: 22 },
      { key: 'bdi', width: 12 },
      { key: 'unitPrice', width: 22 },
      { key: 'totalPrice', width: 24 },
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Gera a Folha de Medição Contratual e Preços Unitários em XLSX (RF-48, RNF-11).
   */
  async generateMeasurementSheet(
    data: MeasurementSheetExportData,
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'LT-Offers Engine';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Folha de Medicao & PUs', {
      views: [{ showGridLines: true }],
    });

    // Bloco de Título
    worksheet.mergeCells('A1:H1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `FOLHA DE MEDIÇÃO CONTRATUAL E PREÇOS UNITÁRIOS - ${data.offerName.toUpperCase()}`;
    titleCell.font = {
      name: 'Calibri',
      size: 14,
      bold: true,
      color: { argb: 'FF1E3A8A' },
    };
    titleCell.alignment = { horizontal: 'left', vertical: 'middle' };
    worksheet.getRow(1).height = 26;

    worksheet.getCell('A2').value =
      `Oferta ID: ${data.offerId} | Revisão: R${data.revisionNumber} | Data de Emissão: ${new Date(data.generatedAt).toLocaleString('pt-BR')}`;
    worksheet.getCell('A2').font = {
      name: 'Calibri',
      size: 10,
      italic: true,
      color: { argb: 'FF6B7280' },
    };
    worksheet.getRow(2).height = 18;

    const headers = [
      'Item',
      'Disciplina Contratual',
      'Descrição do Serviço / Medição',
      'Unidade',
      'Qtd. Contratual',
      'Critério de Medição em Campo',
      'Preço Unitário com Tributos (R$)',
      'Preço Total Contratual (R$)',
    ];

    const headerRow = worksheet.getRow(4);
    headerRow.values = headers;
    headerRow.height = 24;
    headerRow.eachCell((cell) => {
      cell.fill = HEADER_FILL;
      cell.font = HEADER_FONT;
      cell.alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true,
      };
      cell.border = BORDER_THIN;
    });

    let rowIndex = 5;
    for (const item of data.items) {
      const currentRow = worksheet.getRow(rowIndex);
      const qty = Number(item.contractQuantity) || 0;
      const unitPrice = Number(item.unitPriceWithTax) || 0;
      const totalPrice = Number(item.totalContractPrice) || 0;

      currentRow.values = [
        item.itemCode,
        item.discipline,
        item.description,
        item.unit,
        qty,
        item.measurementCriteria,
        unitPrice,
        totalPrice,
      ];

      currentRow.height = 22;

      currentRow.eachCell((cell, colNumber) => {
        cell.border = BORDER_THIN;
        cell.font = { name: 'Calibri', size: 10 };

        if (colNumber === 1 || colNumber === 4) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else if (colNumber === 2 || colNumber === 3 || colNumber === 6) {
          cell.alignment = {
            horizontal: 'left',
            vertical: 'middle',
            wrapText: true,
          };
        } else if (colNumber === 5) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = NUMBER_FORMAT;
        } else {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = CURRENCY_FORMAT;
        }
      });

      rowIndex++;
    }

    // Linha de Total
    const totalRow = worksheet.getRow(rowIndex);
    const totalContract = Number(data.totalContractAmount) || 0;
    totalRow.values = [
      'TOTAL',
      '',
      'TOTAL CONSOLIDADO DAS FOLHAS DE MEDIÇÃO',
      '',
      '',
      '',
      '',
      totalContract,
    ];
    totalRow.height = 24;
    totalRow.eachCell((cell, colNumber) => {
      cell.fill = TOTAL_FILL;
      cell.font = { name: 'Calibri', size: 11, bold: true };
      cell.border = BORDER_THIN;
      if (colNumber === 8) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = CURRENCY_FORMAT;
      }
    });

    worksheet.columns = [
      { key: 'item', width: 12 },
      { key: 'discipline', width: 22 },
      { key: 'desc', width: 40 },
      { key: 'unit', width: 10 },
      { key: 'qty', width: 16 },
      { key: 'criteria', width: 42 },
      { key: 'unitPrice', width: 24 },
      { key: 'totalPrice', width: 24 },
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Gera o Cronograma de Faturamento e Desembolso Mensal em XLSX (RF-60, RNF-11).
   */
  async generateCashflowSheet(data: CashflowExportData): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'LT-Offers Engine';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Fluxo e Desembolso', {
      views: [{ showGridLines: true }],
    });

    // Bloco de Título
    worksheet.mergeCells('A1:J1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `CRONOGRAMA DE FATURAMENTO E DESEMBOLSO MENSAL - ${data.offerName.toUpperCase()}`;
    titleCell.font = {
      name: 'Calibri',
      size: 14,
      bold: true,
      color: { argb: 'FF1E3A8A' },
    };
    titleCell.alignment = { horizontal: 'left', vertical: 'middle' };
    worksheet.getRow(1).height = 26;

    worksheet.getCell('A2').value =
      `Oferta ID: ${data.offerId} | Revisão: R${data.revisionNumber} | Pico de Exposição: Mês ${data.peakExposureMonth} (R$ ${Number(data.peakExposureAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) | Emissão: ${new Date(data.generatedAt).toLocaleString('pt-BR')}`;
    worksheet.getCell('A2').font = {
      name: 'Calibri',
      size: 10,
      italic: true,
      color: { argb: 'FF6B7280' },
    };
    worksheet.getRow(2).height = 18;

    const headers = [
      'Mês',
      'Etiqueta',
      'Desembolso Suprimentos (R$)',
      'Desembolso Serviços (R$)',
      'Desembolso Indiretos (R$)',
      'Desembolso Mensal Total (R$)',
      'Desembolso Acumulado (R$)',
      'Faturamento Mensal (R$)',
      'Faturamento Acumulado (R$)',
      'Saldo Líquido Mensal (R$)',
    ];

    const headerRow = worksheet.getRow(4);
    headerRow.values = headers;
    headerRow.height = 24;
    headerRow.eachCell((cell) => {
      cell.fill = HEADER_FILL;
      cell.font = HEADER_FONT;
      cell.alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true,
      };
      cell.border = BORDER_THIN;
    });

    let rowIndex = 5;
    for (const m of data.months) {
      const currentRow = worksheet.getRow(rowIndex);

      const sup = Number(m.suppliesDisbursement) || 0;
      const srv = Number(m.servicesDisbursement) || 0;
      const ind = Number(m.indirectDisbursement) || 0;
      const totOut = Number(m.monthlyTotalDisbursement) || 0;
      const accOut = Number(m.accumulatedDisbursement) || 0;
      const bill = Number(m.monthlyBilling) || 0;
      const accBill = Number(m.accumulatedBilling) || 0;
      const net = Number(m.netCashflow) || 0;

      currentRow.values = [
        m.monthIndex,
        m.monthLabel,
        sup,
        srv,
        ind,
        totOut,
        accOut,
        bill,
        accBill,
        net,
      ];

      currentRow.height = 20;

      currentRow.eachCell((cell, colNumber) => {
        cell.border = BORDER_THIN;
        cell.font = { name: 'Calibri', size: 10, bold: m.isPeakExposure };

        if (m.isPeakExposure) {
          cell.fill = PEAK_FILL;
        }

        if (colNumber === 1 || colNumber === 2) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = CURRENCY_FORMAT;
        }
      });

      rowIndex++;
    }

    // Linha de Totalização
    const totalRow = worksheet.getRow(rowIndex);
    const totalDisb = Number(data.totalDisbursement) || 0;
    const totalBill = Number(data.totalBilling) || 0;
    const finalNet = totalBill - totalDisb;

    totalRow.values = [
      'TOTAL',
      '',
      '',
      '',
      '',
      totalDisb,
      totalDisb,
      totalBill,
      totalBill,
      finalNet,
    ];
    totalRow.height = 24;
    totalRow.eachCell((cell, colNumber) => {
      cell.fill = TOTAL_FILL;
      cell.font = { name: 'Calibri', size: 11, bold: true };
      cell.border = BORDER_THIN;
      if (colNumber >= 6) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = CURRENCY_FORMAT;
      }
    });

    worksheet.columns = [
      { key: 'monthIndex', width: 8 },
      { key: 'monthLabel', width: 12 },
      { key: 'sup', width: 22 },
      { key: 'srv', width: 22 },
      { key: 'ind', width: 22 },
      { key: 'totOut', width: 24 },
      { key: 'accOut', width: 24 },
      { key: 'bill', width: 22 },
      { key: 'accBill', width: 22 },
      { key: 'net', width: 22 },
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
