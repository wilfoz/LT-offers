import { ExcelGeneratorAdapter } from './excel-generator.adapter';
import {
  TenderSheetExportData,
  MeasurementSheetExportData,
  CashflowExportData,
} from '@lt-offers/domain';

describe('ExcelGeneratorAdapter (RNF-11, RF-47, RF-48, RF-50, RF-60)', () => {
  let adapter: ExcelGeneratorAdapter;

  beforeEach(() => {
    adapter = new ExcelGeneratorAdapter();
  });

  it('should generate a valid binary XLSX buffer for Tender Sheet in ANEEL layout', async () => {
    const data: TenderSheetExportData = {
      offerId: '10',
      offerName: 'LT 500kV Teste ANEEL',
      revisionNumber: 1,
      layout: 'ANEEL_STANDARD',
      generatedAt: new Date().toISOString(),
      rows: [
        {
          cipCode: '',
          description: '1. FORNECIMENTOS',
          unit: '',
          quantity: '',
          directUnitCost: '',
          directTotalCost: '1000000.00',
          bdiRate: '28.50',
          unitPrice: '',
          totalPrice: '1285000.00',
          group: 'SUPPLIES',
          level: 1,
        },
        {
          cipCode: 'CIP-01.01',
          description: 'Torres Galvanizadas',
          unit: 't',
          quantity: '500.00',
          directUnitCost: '2000.00',
          directTotalCost: '1000000.00',
          bdiRate: '28.50',
          unitPrice: '2570.00',
          totalPrice: '1285000.00',
          group: 'SUPPLIES',
          level: 2,
        },
        {
          cipCode: 'TOTAL',
          description: 'TOTAL GERAL DA PROPOSTA',
          unit: '',
          quantity: '',
          directUnitCost: '',
          directTotalCost: '1000000.00',
          bdiRate: '28.50',
          unitPrice: '',
          totalPrice: '1285000.00',
          isTotal: true,
        },
      ],
      totalDirectCost: '1000000.00',
      totalSalePrice: '1285000.00',
      effectiveBdi: '28.50',
    };

    const buffer = await adapter.generateTenderSheet(data);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000); // Valida que gerou arquivo binário XLSX real
  });

  it('should generate a valid binary XLSX buffer for Tender Sheet in Celeo layout', async () => {
    const data: TenderSheetExportData = {
      offerId: '10',
      offerName: 'LT 500kV Celeo',
      revisionNumber: 0,
      layout: 'CELEO_STANDARD',
      generatedAt: new Date().toISOString(),
      rows: [
        {
          cipCode: 'CEL-01.01',
          description: 'Topografia e Projetos',
          unit: 'km',
          quantity: '100.00',
          directUnitCost: '5000.00',
          directTotalCost: '500000.00',
          bdiRate: '30.00',
          unitPrice: '6500.00',
          totalPrice: '650000.00',
          level: 2,
        },
      ],
      totalDirectCost: '500000.00',
      totalSalePrice: '650000.00',
      effectiveBdi: '30.00',
    };

    const buffer = await adapter.generateTenderSheet(data);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
  });

  it('should generate a valid binary XLSX buffer for Measurement Sheet (RF-48)', async () => {
    const data: MeasurementSheetExportData = {
      offerId: '10',
      offerName: 'LT 500kV Medição',
      revisionNumber: 0,
      generatedAt: new Date().toISOString(),
      items: [
        {
          itemCode: 'M1 / PU1',
          discipline: 'CIVIL',
          description: 'Escavação e Concreto',
          unit: 'm³',
          contractQuantity: '1000.00',
          measurementCriteria: 'Volume geométrico in loco',
          unitPriceWithTax: '450.00',
          totalContractPrice: '450000.00',
        },
      ],
      totalContractAmount: '450000.00',
    };

    const buffer = await adapter.generateMeasurementSheet(data);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
  });

  it('should generate a valid binary XLSX buffer for Cashflow Schedule with peak highlight (RF-60)', async () => {
    const data: CashflowExportData = {
      offerId: '10',
      offerName: 'LT 500kV Fluxo de Caixa',
      revisionNumber: 0,
      generatedAt: new Date().toISOString(),
      months: [
        {
          monthIndex: 1,
          monthLabel: 'Mês 01',
          suppliesDisbursement: '0.00',
          servicesDisbursement: '10000.00',
          indirectDisbursement: '5000.00',
          monthlyTotalDisbursement: '15000.00',
          accumulatedDisbursement: '15000.00',
          monthlyBilling: '0.00',
          accumulatedBilling: '0.00',
          netCashflow: '-15000.00',
          isPeakExposure: true,
        },
      ],
      peakExposureMonth: 1,
      peakExposureAmount: '15000.00',
      totalDisbursement: '15000.00',
      totalBilling: '0.00',
    };

    const buffer = await adapter.generateCashflowSheet(data);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
  });
});
