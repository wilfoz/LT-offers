import {
  FoundationMatrixLookupItem,
  FoundationVolumeQuantities,
  LineFoundationSummary,
} from '@lt-offers/domain';
import {
  LineFoundationCalculation,
  LineFoundationsNotFoundException,
  LineFoundationsQueryData,
  LineFoundationsQueryPort,
  FoundationVolumeMatricesQueryPort,
} from '../../domain';
import { CalculateLineFoundationsUseCase } from './calculate-line-foundations.usecase';
import { GetLineFoundationSummaryUseCase } from './get-line-foundation-summary.usecase';
import { GetLineFoundationTraceabilityUseCase } from './get-line-foundation-traceability.usecase';
import { GetLineFoundationValidationUseCase } from './get-line-foundation-validation.usecase';
import { FoundationsFacadeService } from '../services/foundations-facade.service';

function createMockQuantities(
  partial: Partial<FoundationVolumeQuantities> = {},
): FoundationVolumeQuantities {
  return partial as unknown as FoundationVolumeQuantities;
}

class InMemoryLineFoundationsQueryAdapter implements LineFoundationsQueryPort {
  private lines = new Map<number, LineFoundationsQueryData>();

  setLine(line: LineFoundationsQueryData) {
    this.lines.set(line.id, line);
  }

  async findLineFoundationsData(
    lineId: number,
  ): Promise<LineFoundationsQueryData | null> {
    return this.lines.get(lineId) || null;
  }
}

class InMemoryFoundationVolumeMatricesQueryAdapter implements FoundationVolumeMatricesQueryPort {
  private matrices: FoundationMatrixLookupItem[] = [];

  setMatrices(matrices: FoundationMatrixLookupItem[]) {
    this.matrices = matrices;
  }

  async loadEffectiveVolumeMatrices(): Promise<FoundationMatrixLookupItem[]> {
    return this.matrices;
  }
}

describe('Foundations Use Cases (Hexagonal Application Layer)', () => {
  let lineQueryPort: InMemoryLineFoundationsQueryAdapter;
  let matricesQueryPort: InMemoryFoundationVolumeMatricesQueryAdapter;

  let calculateUseCase: CalculateLineFoundationsUseCase;
  let summaryUseCase: GetLineFoundationSummaryUseCase;
  let traceabilityUseCase: GetLineFoundationTraceabilityUseCase;
  let validationUseCase: GetLineFoundationValidationUseCase;
  let facadeService: FoundationsFacadeService;

  beforeEach(() => {
    lineQueryPort = new InMemoryLineFoundationsQueryAdapter();
    matricesQueryPort = new InMemoryFoundationVolumeMatricesQueryAdapter();

    calculateUseCase = new CalculateLineFoundationsUseCase(
      lineQueryPort,
      matricesQueryPort,
    );
    summaryUseCase = new GetLineFoundationSummaryUseCase(calculateUseCase);
    traceabilityUseCase = new GetLineFoundationTraceabilityUseCase(
      calculateUseCase,
    );
    validationUseCase = new GetLineFoundationValidationUseCase(
      calculateUseCase,
    );
    facadeService = new FoundationsFacadeService(
      calculateUseCase,
      summaryUseCase,
      traceabilityUseCase,
      validationUseCase,
    );
  });

  it('deve lançar LineFoundationsNotFoundException se a linha de transmissão não existir', async () => {
    await expect(calculateUseCase.execute(999)).rejects.toThrow(
      LineFoundationsNotFoundException,
    );
  });

  it('deve calcular quantitativos com torres de estaqueamento e matrizes de volume', async () => {
    lineQueryPort.setLine({
      id: 1,
      refinedLengthKm: '10.000',
      reportLengthKm: '10.000',
      stakingTowers: [
        {
          id: 1,
          towerNumber: 'T01',
          stationMeters: '0.000',
          towerTypeId: 1,
          soilTypeId: 2,
          foundationTypeId: 3,
          towerCode: 'SL-20',
          soilCode: 'II',
          foundationCode: 'SAP',
        },
      ],
      preliminaryStakingDistribution: null,
    });

    matricesQueryPort.setMatrices([
      {
        towerTypeId: 1,
        soilTypeId: 2,
        foundationTypeId: 3,
        quantities: createMockQuantities({
          excavationNormalFootingM3: '20.000',
          concreteFootingsM3: '15.000',
          steelFootingsKg: '1000.00',
        }),
      },
    ]);

    const result: LineFoundationCalculation = await calculateUseCase.execute(1);

    expect(result).toBeDefined();
    expect(result.summary.totalTowers).toBe(1);
    expect(result.summary.calculatedTowers).toBe(1);
    expect(result.summary.pendingTowers).toBe(0);
    expect(result.summary.kpis.totalExcavationM3).toBe('21.000'); // 20 + 5%
    expect(result.summary.kpis.totalConcreteM3).toBe('15.750'); // 15 + 5%
    expect(result.summary.kpis.totalSteelKg).toBe('1100.00'); // 1000 + 10%
    expect(result.hasErrors).toBe(false);
  });

  it('deve calcular quantitativos com distribuição preliminar paramétrica (RN-06)', async () => {
    lineQueryPort.setLine({
      id: 2,
      refinedLengthKm: '4.000',
      reportLengthKm: '4.000',
      stakingTowers: [],
      preliminaryStakingDistribution: {
        soilPercentages: [{ id: 2, percentage: '100.00' }],
        foundationPercentages: [{ id: 3, percentage: '100.00' }],
      },
    });

    matricesQueryPort.setMatrices([
      {
        towerTypeId: 1,
        soilTypeId: 2,
        foundationTypeId: 3,
        quantities: createMockQuantities({
          excavationNormalFootingM3: '10.000',
          concreteFootingsM3: '5.000',
          steelFootingsKg: '500.00',
        }),
      },
    ]);

    const summary: LineFoundationSummary = await summaryUseCase.execute(2);

    expect(summary).toBeDefined();
    expect(summary.calculationMode).toBe('PRELIMINARY_PARAMETRIC');
    expect(summary.totalTowers).toBe(10); // 4km / 0.4km = 10 torres estimadas
  });

  it('deve retornar rastreabilidade item a item via GetLineFoundationTraceabilityUseCase (RF-27)', async () => {
    lineQueryPort.setLine({
      id: 1,
      stakingTowers: [
        {
          id: 1,
          towerNumber: 'T01',
          stationMeters: '0.000',
          towerTypeId: 1,
          soilTypeId: 2,
          foundationTypeId: 3,
        },
      ],
    });

    matricesQueryPort.setMatrices([
      {
        towerTypeId: 1,
        soilTypeId: 2,
        foundationTypeId: 3,
        quantities: createMockQuantities({
          excavationNormalFootingM3: '20.000',
        }),
      },
    ]);

    const trace = await traceabilityUseCase.execute(1);

    expect(trace).toBeDefined();
    expect(trace.excavationNormalFootingM3).toBeDefined();
    expect(trace.excavationNormalFootingM3.totalQuantity).toBe('21.000');
  });

  it('deve retornar diagnóstico geotécnico e detectar inconsistências via GetLineFoundationValidationUseCase (RF-20)', async () => {
    lineQueryPort.setLine({
      id: 1,
      stakingTowers: [
        {
          id: 1,
          towerNumber: 'T01',
          stationMeters: '0.000',
          towerTypeId: null,
          soilTypeId: null,
          foundationTypeId: null,
        },
      ],
      preliminaryStakingDistribution: null,
    });

    matricesQueryPort.setMatrices([]);

    const validation = await validationUseCase.execute(1);

    expect(validation.hasErrors).toBe(true);
    expect(validation.pendingTowers).toBe(1);
    expect(validation.transmissionLineId).toBe(1);
  });

  it('deve delegar chamadas corretamente via FoundationsFacadeService', async () => {
    lineQueryPort.setLine({
      id: 1,
      stakingTowers: [
        {
          id: 1,
          towerNumber: 'T01',
          stationMeters: '0.000',
          towerTypeId: 1,
          soilTypeId: 2,
          foundationTypeId: 3,
        },
      ],
    });

    matricesQueryPort.setMatrices([
      {
        towerTypeId: 1,
        soilTypeId: 2,
        foundationTypeId: 3,
        quantities: createMockQuantities({
          excavationNormalFootingM3: '20.000',
        }),
      },
    ]);

    const full = await facadeService.calculateFoundationsForLine(1);
    expect(full.summary.totalTowers).toBe(1);

    const sum = await facadeService.getLineFoundationSummary(1);
    expect(sum.totalTowers).toBe(1);

    const trace = await facadeService.getLineFoundationTraceability(1);
    expect(trace.excavationNormalFootingM3).toBeDefined();

    const val = await facadeService.getLineFoundationValidation(1);
    expect(val.transmissionLineId).toBe(1);
  });
});
