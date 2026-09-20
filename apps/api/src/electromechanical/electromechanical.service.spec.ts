import { ElectromechanicalService } from './electromechanical.service';
import { PrismaService } from '../app/prisma.service';

describe('ElectromechanicalService (M05, RF-23..RF-27)', () => {
  let service: ElectromechanicalService;
  let prismaMock: {
    transmissionLine: {
      findUnique: jest.Mock;
    };
  };

  beforeEach(() => {
    prismaMock = {
      transmissionLine: {
        findUnique: jest.fn().mockResolvedValue({
          id: 1,
          name: 'LT 500 kV Poções III - Padre Paraíso C1',
          code: 'LT-500-01',
          refinedLengthKm: '100.0',
          reportLengthKm: '100.0',
          nominalVoltageKv: '500',
          offerRevision: {
            offer: {
              code: 'OFR-001',
            },
          },
        }),
      },
    };

    service = new ElectromechanicalService(
      prismaMock as unknown as PrismaService,
    );
  });

  it('deve calcular o resumo completo de quantitativos eletromecânicos da linha', async () => {
    const summary = await service.calculateLineElectromechanical(1);

    expect(summary.lineId).toBe('1');
    expect(summary.lineName).toBe('LT 500 kV Poções III - Padre Paraíso C1');
    expect(summary.totalTowers).toBe(250);
    expect(summary.kpis.totalTowerSteelTons).toBeGreaterThan(0);
    expect(summary.kpis.totalConductorKm).toBeGreaterThan(1000);
    expect(summary.kpis.totalGroundWireKm).toBeGreaterThan(100);
    expect(summary.kpis.totalInsulatorUnits).toBeGreaterThan(1000);
    expect(summary.towers.length).toBeGreaterThan(0);
    expect(summary.conductors.length).toBeGreaterThan(0);
    expect(summary.groundWires.length).toBeGreaterThan(0);
    expect(summary.insulators.length).toBeGreaterThan(0);
    expect(summary.accesses.length).toBeGreaterThan(0);
    expect(summary.consolidatedMaterials.length).toBeGreaterThan(0);
  });

  it('deve retornar a lista de rastreabilidade torre a torre', async () => {
    const traceability = await service.getLineElectromechanicalTraceability(1);

    expect(traceability.length).toBe(250);
    expect(traceability[0].towerNumber).toBe('T001');
    expect(traceability[0].totalStructureWeightKg).toBeGreaterThan(10000);
  });
});
