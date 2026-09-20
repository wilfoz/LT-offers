import { RunOfferChecksUseCase } from './run-offer-checks.usecase';
import {
  ChecksDataQueryPort,
  OfferChecksNotFoundException,
  StakingCheckData,
  MaterialCheckData,
  ScheduleCheckData,
  HistogramCheckData,
  ServiceCheckData,
  CashflowCheckData,
} from '../../domain';

class InMemoryChecksDataQueryAdapter implements ChecksDataQueryPort {
  public exists = true;
  public stakingData: StakingCheckData[] = [];
  public materialsData: MaterialCheckData[] = [];
  public scheduleData: ScheduleCheckData[] = [];
  public histogramData: HistogramCheckData[] = [];
  public servicesData: ServiceCheckData[] = [];
  public cashflowData?: CashflowCheckData;

  async checkOfferExists(offerId: string): Promise<boolean> {
    return this.exists;
  }

  async getStakingData(offerId: string): Promise<StakingCheckData[]> {
    return this.stakingData;
  }

  async getMaterialsData(offerId: string): Promise<MaterialCheckData[]> {
    return this.materialsData;
  }

  async getScheduleData(offerId: string): Promise<ScheduleCheckData[]> {
    return this.scheduleData;
  }

  async getHistogramData(offerId: string): Promise<HistogramCheckData[]> {
    return this.histogramData;
  }

  async getServicesData(offerId: string): Promise<ServiceCheckData[]> {
    return this.servicesData;
  }

  async getCashflowData(
    offerId: string,
  ): Promise<CashflowCheckData | undefined> {
    return this.cashflowData;
  }
}

describe('RunOfferChecksUseCase (RN-13, RF-62, RF-63)', () => {
  let adapter: InMemoryChecksDataQueryAdapter;
  let useCase: RunOfferChecksUseCase;

  beforeEach(() => {
    adapter = new InMemoryChecksDataQueryAdapter();
    useCase = new RunOfferChecksUseCase(adapter);
  });

  it('deve retornar status HEALTHY quando todos os módulos são consistentes', async () => {
    adapter.stakingData = [
      {
        lineId: '10',
        lineName: 'LT 500kV Trecho A',
        declaredTowersCount: 250,
        actualStakingCount: 250,
        invalidSoilFoundationPairsCount: 0,
      },
    ];
    adapter.materialsData = [
      {
        materialId: 'mat-1',
        materialName: 'Cabos Condutores',
        quantity: '150000',
        hasSelectedQuote: true,
        originState: 'SP',
        isTaxResolved: true,
      },
    ];
    adapter.scheduleData = [
      {
        lineId: '10',
        lineName: 'LT 500kV Trecho A',
        activityId: 'act-1',
        activityName: 'Montagem de Torres',
        requiredDailyProduction: '1.20',
        maxTeamDailyProduction: '2.00',
        isMilestoneExceeded: false,
      },
    ];
    adapter.servicesData = [
      {
        lineId: '10',
        lineName: 'LT 500kV Trecho A',
        totalEngineeredQuantity: '100.00',
        totalBudgetedQuantity: '100.00',
        unassignedCipCount: 0,
      },
    ];
    adapter.cashflowData = {
      totalDisbursementSale: '100000000.00',
      totalEconomicResultSale: '100000000.00',
    };

    const summary = await useCase.execute(1);

    expect(summary.offerId).toBe('1');
    expect(summary.status).toBe('HEALTHY');
    expect(summary.criticalCount).toBe(0);
    expect(summary.warningCount).toBe(0);
    expect(summary.canCloseRevision).toBe(true);
    expect(summary.requiresJustification).toBe(false);
    expect(summary.findings).toHaveLength(0);
  });

  it('deve retornar status WARNINGS_ONLY quando há avisos e nenhum erro crítico', async () => {
    adapter.stakingData = [
      {
        lineId: '10',
        lineName: 'LT 500kV Trecho A',
        declaredTowersCount: 250,
        actualStakingCount: 250,
        invalidSoilFoundationPairsCount: 0,
      },
    ];
    adapter.scheduleData = [
      {
        lineId: '10',
        lineName: 'LT 500kV Trecho A',
        activityId: 'act-1',
        activityName: 'Montagem de Torres',
        requiredDailyProduction: '3.50', // Excede capacidade da equipe de 2.00
        maxTeamDailyProduction: '2.00',
        isMilestoneExceeded: false,
      },
    ];

    const summary = await useCase.execute(1);

    expect(summary.status).toBe('WARNINGS_ONLY');
    expect(summary.criticalCount).toBe(0);
    expect(summary.warningCount).toBe(1);
    expect(summary.canCloseRevision).toBe(true);
    expect(summary.requiresJustification).toBe(true);
    expect(summary.findings[0].module).toBe('SCHEDULE_RESOURCES');
  });

  it('deve retornar status CRITICAL_ERRORS quando há divergências impeditivas', async () => {
    adapter.stakingData = [
      {
        lineId: '10',
        lineName: 'LT 500kV Trecho A',
        declaredTowersCount: 250,
        actualStakingCount: 230, // Divergência na contagem de estruturas
      },
    ];
    adapter.materialsData = [
      {
        materialId: 'mat-1',
        materialName: 'Cabos Condutores',
        quantity: '150000',
        hasSelectedQuote: false, // Cotação não selecionada
        originState: 'SP',
        isTaxResolved: true,
      },
    ];

    const summary = await useCase.execute(1);

    expect(summary.status).toBe('CRITICAL_ERRORS');
    expect(summary.criticalCount).toBeGreaterThan(0);
    expect(summary.canCloseRevision).toBe(false);
    expect(summary.requiresJustification).toBe(false);
  });

  it('deve lançar OfferChecksNotFoundException quando a oferta não existir', async () => {
    adapter.exists = false;

    await expect(useCase.execute(999)).rejects.toThrow(
      OfferChecksNotFoundException,
    );
  });
});
