import {
  TenderSheetLayout,
  TenderSheetExportData,
  MeasurementSheetExportData,
  CashflowExportData,
  PerformanceIndicatorsSummary,
  FullOfferPackage,
} from './export-contracts';

describe('Export Contracts Domain Models (RF-47, RF-48, RF-49, RF-50, RF-60, RNF-18)', () => {
  it('should support valid TenderSheetLayout values', () => {
    const layouts: TenderSheetLayout[] = [
      'ANEEL_STANDARD',
      'CELEO_STANDARD',
      'GENERIC_EPC',
    ];
    expect(layouts).toHaveLength(3);
  });

  it('should structure TenderSheetExportData correctly', () => {
    const data: TenderSheetExportData = {
      offerId: 'offer-1',
      offerName: 'LT 500kV Teste',
      revisionNumber: 0,
      layout: 'ANEEL_STANDARD',
      generatedAt: new Date().toISOString(),
      rows: [
        {
          cipCode: 'CIP-01.01',
          description: 'Fornecimento de Estruturas Metálicas',
          unit: 't',
          quantity: '1250.00',
          directUnitCost: '18500.00',
          directTotalCost: '23125000.00',
          bdiRate: '28.50',
          unitPrice: '23772.50',
          totalPrice: '29715625.00',
          group: 'SUPPLIES',
          level: 2,
        },
      ],
      totalDirectCost: '23125000.00',
      totalSalePrice: '29715625.00',
      effectiveBdi: '28.50',
    };

    expect(data.rows[0].cipCode).toBe('CIP-01.01');
    expect(data.layout).toBe('ANEEL_STANDARD');
  });

  it('should structure MeasurementSheetExportData correctly', () => {
    const data: MeasurementSheetExportData = {
      offerId: 'offer-1',
      offerName: 'LT 500kV Teste',
      revisionNumber: 0,
      generatedAt: new Date().toISOString(),
      items: [
        {
          itemCode: 'M1',
          discipline: 'FOUNDATIONS',
          description: 'Escavação em solo de 1ª categoria',
          unit: 'm³',
          contractQuantity: '4500.00',
          measurementCriteria: 'Volume geométrico escavado in loco',
          unitPriceWithTax: '45.00',
          totalContractPrice: '202500.00',
        },
      ],
      totalContractAmount: '202500.00',
    };

    expect(data.items[0].itemCode).toBe('M1');
  });

  it('should structure PerformanceIndicatorsSummary correctly', () => {
    const summary: PerformanceIndicatorsSummary = {
      offerId: 'offer-1',
      consolidated: {
        lengthKm: '150.00',
        towerCount: 375,
        costPerKm: '1200000.00',
        costPerTower: '480000.00',
        suppliesCostPerKm: '750000.00',
        suppliesCostPerTower: '300000.00',
        servicesCostPerKm: '450000.00',
        servicesCostPerTower: '180000.00',
        structuresDensityPerKm: '2.50',
        averageSpanMeters: '400.00',
        concretePerKm: '120.00',
        concretePerTower: '48.00',
        steelPerKm: '45.00',
        steelPerTower: '18.00',
      },
      byLine: [],
    };

    expect(summary.consolidated.towerCount).toBe(375);
  });
});
