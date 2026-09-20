import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ElectromechanicalController } from './electromechanical.controller';
import {
  CalculateLineElectromechanicalUseCase,
  GetLineElectromechanicalTraceabilityUseCase,
} from '../../application/usecases';
import {
  LineElectromechanicalCalculation,
  LineElectromechanicalNotFoundException,
} from '../../domain';

describe('ElectromechanicalController (M05, RF-23..RF-27)', () => {
  let controller: ElectromechanicalController;
  let calculateUseCase: jest.Mocked<CalculateLineElectromechanicalUseCase>;
  let traceabilityUseCase: jest.Mocked<GetLineElectromechanicalTraceabilityUseCase>;

  const mockSummary = {
    lineId: '1',
    lineName: 'LT 500 kV Poções III - Padre Paraíso C1',
    lineLengthKm: 100,
    totalTowers: 250,
    kpis: {
      totalTowerSteelTons: 4500,
      totalConductorKm: 1200,
      totalConductorTons: 2200,
      totalGroundWireKm: 200,
      totalGroundWireTons: 100,
      totalInsulatorUnits: 15000,
      totalAccessKm: 80,
      totalClearingHectares: 500,
    },
    towers: [],
    conductors: [],
    groundWires: [],
    insulators: [],
    guyWires: [],
    dampers: [],
    grounding: [],
    warningMarkers: [],
    accesses: [],
    vegetationClearing: [],
    crossings: [],
    consolidatedMaterials: [],
  };

  beforeEach(async () => {
    calculateUseCase = {
      execute: jest
        .fn()
        .mockResolvedValue(
          new LineElectromechanicalCalculation(1, mockSummary),
        ),
    } as any;

    traceabilityUseCase = {
      execute: jest.fn().mockResolvedValue([
        {
          towerNumber: 'T001',
          stationMeters: '0',
          towerTypeCode: 'SUSP-LEVE',
          heightM: 35,
          legExtensionM: 0,
          nominalWeightKg: 14500,
          legExtensionWeightKg: 0,
          totalStructureWeightKg: 14500,
        },
      ]),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ElectromechanicalController],
      providers: [
        {
          provide: CalculateLineElectromechanicalUseCase,
          useValue: calculateUseCase,
        },
        {
          provide: GetLineElectromechanicalTraceabilityUseCase,
          useValue: traceabilityUseCase,
        },
      ],
    }).compile();

    controller = module.get<ElectromechanicalController>(
      ElectromechanicalController,
    );
  });

  it('deve retornar o resumo de quantitativos eletromecânicos da linha', async () => {
    const result = await controller.getSummary(1);

    expect(result.lineId).toBe('1');
    expect(result.totalTowers).toBe(250);
    expect(calculateUseCase.execute).toHaveBeenCalledWith(1, undefined);
  });

  it('deve repassar NotFoundException caso a linha não exista', async () => {
    calculateUseCase.execute.mockRejectedValueOnce(
      new LineElectromechanicalNotFoundException(999),
    );

    await expect(controller.getSummary(999)).rejects.toThrow(NotFoundException);
  });

  it('deve retornar a lista de rastreabilidade torre a torre', async () => {
    const result = await controller.getTraceability(1);

    expect(result.length).toBe(1);
    expect(result[0].towerNumber).toBe('T001');
    expect(traceabilityUseCase.execute).toHaveBeenCalledWith(1, undefined);
  });

  it('deve repassar NotFoundException na rastreabilidade caso a linha não exista', async () => {
    traceabilityUseCase.execute.mockRejectedValueOnce(
      new LineElectromechanicalNotFoundException(999),
    );

    await expect(controller.getTraceability(999)).rejects.toThrow(
      NotFoundException,
    );
  });
});
