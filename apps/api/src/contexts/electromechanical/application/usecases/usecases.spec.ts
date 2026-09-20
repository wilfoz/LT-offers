import { CalculateLineElectromechanicalUseCase } from './calculate-line-electromechanical.usecase';
import { GetLineElectromechanicalTraceabilityUseCase } from './get-line-electromechanical-traceability.usecase';
import {
  LineElectromechanicalQueryPort,
  ElectromechanicalCatalogsQueryPort,
  LineElectromechanicalNotFoundException,
} from '../../domain';

describe('Electromechanical Use Cases (M05, RF-23..RF-27)', () => {
  let mockLineQueryPort: LineElectromechanicalQueryPort;
  let mockCatalogsQueryPort: ElectromechanicalCatalogsQueryPort;
  let calculateUseCase: CalculateLineElectromechanicalUseCase;
  let traceabilityUseCase: GetLineElectromechanicalTraceabilityUseCase;

  beforeEach(() => {
    mockLineQueryPort = {
      findLineElectromechanicalData: jest.fn().mockResolvedValue({
        id: 1,
        name: 'LT 500 kV Poções III - Padre Paraíso C1',
        refinedLengthKm: '100.0',
        reportLengthKm: '100.0',
        nominalVoltageKv: '500',
      }),
    };

    mockCatalogsQueryPort = {
      loadEffectiveCatalogs: jest.fn().mockResolvedValue({
        referenceDate: '2026-09-20',
      }),
    };

    calculateUseCase = new CalculateLineElectromechanicalUseCase(
      mockLineQueryPort,
      mockCatalogsQueryPort,
    );
    traceabilityUseCase = new GetLineElectromechanicalTraceabilityUseCase(
      calculateUseCase,
    );
  });

  describe('CalculateLineElectromechanicalUseCase', () => {
    it('deve calcular o resumo completo de quantitativos eletromecânicos da linha', async () => {
      const calculation = await calculateUseCase.execute(1, '2026-09-20');

      expect(calculation.lineId).toBe(1);
      expect(calculation.totalTowers).toBe(250);
      expect(calculation.kpis.totalTowerSteelTons).toBeGreaterThan(0);
      expect(calculation.kpis.totalConductorKm).toBeGreaterThan(1000);
      expect(calculation.kpis.totalGroundWireKm).toBeGreaterThan(100);
      expect(calculation.kpis.totalInsulatorUnits).toBeGreaterThan(1000);
      expect(calculation.towers.length).toBeGreaterThan(0);
      expect(calculation.conductors.length).toBeGreaterThan(0);
      expect(calculation.groundWires.length).toBeGreaterThan(0);
      expect(calculation.insulators.length).toBeGreaterThan(0);
      expect(calculation.accesses.length).toBeGreaterThan(0);
      expect(calculation.consolidatedMaterials.length).toBeGreaterThan(0);

      expect(mockCatalogsQueryPort.loadEffectiveCatalogs).toHaveBeenCalledWith(
        '2026-09-20',
      );
    });

    it('deve lançar LineElectromechanicalNotFoundException se a linha não existir', async () => {
      jest
        .spyOn(mockLineQueryPort, 'findLineElectromechanicalData')
        .mockResolvedValueOnce(null);

      await expect(calculateUseCase.execute(999)).rejects.toThrow(
        LineElectromechanicalNotFoundException,
      );
    });
  });

  describe('GetLineElectromechanicalTraceabilityUseCase', () => {
    it('deve retornar a lista de rastreabilidade torre a torre', async () => {
      const traceability = await traceabilityUseCase.execute(1);

      expect(traceability.length).toBe(250);
      expect(traceability[0].towerNumber).toBe('T001');
      expect(traceability[0].totalStructureWeightKg).toBeGreaterThan(10000);
    });

    it('deve repassar LineElectromechanicalNotFoundException quando a linha não existir', async () => {
      jest
        .spyOn(mockLineQueryPort, 'findLineElectromechanicalData')
        .mockResolvedValueOnce(null);

      await expect(traceabilityUseCase.execute(999)).rejects.toThrow(
        LineElectromechanicalNotFoundException,
      );
    });
  });
});
