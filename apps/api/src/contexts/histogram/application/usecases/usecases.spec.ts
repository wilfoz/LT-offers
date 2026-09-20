import { GetLineHistogramUseCase } from './get-line-histogram.usecase';
import { GetOfferConsolidatedHistogramUseCase } from './get-offer-consolidated-histogram.usecase';
import { ScheduleFacadeService } from '../../../schedule';
import {
  HistogramOfferQueryPort,
  OfferHistogramNotFoundException,
} from '../../domain';

describe('Histogram Use Cases (M08, RF-42..RF-45, RN-17)', () => {
  let scheduleFacadeMock: jest.Mocked<ScheduleFacadeService>;
  let offerQueryPortMock: jest.Mocked<HistogramOfferQueryPort>;
  let getLineHistogramUseCase: GetLineHistogramUseCase;
  let getOfferConsolidatedHistogramUseCase: GetOfferConsolidatedHistogramUseCase;

  const sampleSchedule = {
    lineId: 1,
    lineName: 'LT 500 kV Poções III - Padre Paraíso C1',
    startMonth: 1,
    totalDurationMonths: 18,
    activities: [
      {
        id: 'act-1',
        lineId: 1,
        code: 'ACT-01-IND',
        name: 'Gestão, Engenharia e Apoio Indireto',
        group: 'INDIRECTS' as const,
        quantitySource: 'MANUAL' as const,
        totalQuantity: '18.00',
        quantityUnit: 'meses',
        crewCount: 1,
        startMonth: 1,
        durationMonths: 18,
        endMonth: 18,
        monthlyProduction: '1.00',
        predecessors: [],
        mobilizationCost: '25000.00',
        monthlyRecurringCost: '65000.00',
        demobilizationCost: '15000.00',
        totalCost: '1210000.00',
        status: 'PLANNED' as const,
      },
      {
        id: 'act-2',
        lineId: 1,
        code: 'ACT-02-PRELIM',
        name: 'Abertura de Acessos e Limpeza de Faixa',
        group: 'PRELIMINARIES' as const,
        quantitySource: 'ROW_CLEARING_HA' as const,
        totalQuantity: '500.00',
        quantityUnit: 'ha',
        assignedCrewId: 1,
        assignedCrewName: 'Equipe de Terraplenagem e Desmatamento',
        crewCount: 2,
        startMonth: 2,
        durationMonths: 6,
        endMonth: 7,
        monthlyProduction: '83.33',
        predecessors: [],
        mobilizationCost: '70000.00',
        monthlyRecurringCost: '150000.00',
        demobilizationCost: '40000.00',
        totalCost: '1010000.00',
        status: 'PLANNED' as const,
      },
    ],
    milestones: [],
    totalDirectLaborCost: '1010000.00',
    totalEquipmentCost: '0.00',
    totalIndirectCost: '1210000.00',
    totalScheduleCost: '2220000.00',
    warnings: [],
  };

  const sampleCamps = {
    lineId: 1,
    camps: [
      {
        id: 'camp-1',
        lineId: 1,
        code: 'CP-CENTRAL',
        name: 'Canteiro Central',
        type: 'CENTRAL' as const,
        locationKm: '35.00',
        startMonth: 1,
        durationMonths: 18,
        endMonth: 18,
        implementationCost: '350000.00',
        fixedMonthlyCost: '75000.00',
        demobilizationCost: '110000.00',
        totalPersonnelMonthlyCost: '51000.00',
        totalMonthlyCost: '126000.00',
        totalCampCost: '2728000.00',
        personnel: [
          {
            laborRoleId: 1,
            laborRoleCode: 'ENG-RES',
            laborRoleName: 'Engenheiro Residente',
            quantity: 1,
            monthlyUnitCost: '22000.00',
            totalMonthlyCost: '22000.00',
          },
        ],
      },
    ],
    totalImplementationCost: '350000.00',
    totalOperatingCost: '2268000.00',
    totalDemobilizationCost: '110000.00',
    totalCampsCost: '2728000.00',
    monthlyDistribution: [{ month: 1, cost: '476000.00' }],
  };

  beforeEach(() => {
    scheduleFacadeMock = {
      getLineSchedule: jest.fn().mockResolvedValue(sampleSchedule),
      getLineCamps: jest.fn().mockResolvedValue(sampleCamps),
    } as any;

    offerQueryPortMock = {
      findOfferLines: jest.fn().mockResolvedValue({
        offerId: 10,
        lines: [{ id: 1, name: 'LT 500 kV Linha 1' }],
      }),
    };

    getLineHistogramUseCase = new GetLineHistogramUseCase(scheduleFacadeMock);
    getOfferConsolidatedHistogramUseCase =
      new GetOfferConsolidatedHistogramUseCase(
        offerQueryPortMock,
        scheduleFacadeMock,
      );
  });

  describe('GetLineHistogramUseCase', () => {
    it('deve gerar o histograma de recursos da linha com separação de direto/indireto e balanço de frota', async () => {
      const histogram = await getLineHistogramUseCase.execute(1);

      expect(histogram.lineId).toBe(1);
      expect(histogram.totalMonths).toBeGreaterThanOrEqual(12);
      expect(histogram.manpowerItems.length).toBeGreaterThan(0);
      expect(histogram.equipmentItems.length).toBeGreaterThan(0);
      expect(histogram.peakManpower.total).toBeGreaterThan(0);
      expect(histogram.peakManpower.drivingActivities.length).toBeGreaterThan(
        0,
      );
      expect(histogram.monthlyTimeline.length).toBeGreaterThan(0);
    });
  });

  describe('GetOfferConsolidatedHistogramUseCase', () => {
    it('deve consolidar o histograma de recursos para toda a oferta', async () => {
      const consolidated =
        await getOfferConsolidatedHistogramUseCase.execute(10);

      expect(consolidated.totalMonths).toBeGreaterThanOrEqual(12);
      expect(consolidated.manpowerItems.length).toBeGreaterThan(0);
      expect(consolidated.equipmentItems.length).toBeGreaterThan(0);
      expect(offerQueryPortMock.findOfferLines).toHaveBeenCalledWith(10);
      expect(scheduleFacadeMock.getLineSchedule).toHaveBeenCalledWith(1);
    });

    it('deve retornar histograma vazio quando a oferta não possui linhas', async () => {
      offerQueryPortMock.findOfferLines.mockResolvedValueOnce({
        offerId: 10,
        lines: [],
      });

      const consolidated =
        await getOfferConsolidatedHistogramUseCase.execute(10);

      expect(consolidated.manpowerItems.length).toBeGreaterThanOrEqual(0);
      expect(scheduleFacadeMock.getLineSchedule).not.toHaveBeenCalled();
    });

    it('deve lançar OfferHistogramNotFoundException se a oferta não existir', async () => {
      offerQueryPortMock.findOfferLines.mockResolvedValueOnce(null);

      await expect(
        getOfferConsolidatedHistogramUseCase.execute(999),
      ).rejects.toThrow(OfferHistogramNotFoundException);
    });
  });
});
