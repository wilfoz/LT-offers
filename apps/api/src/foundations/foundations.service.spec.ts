import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../app/prisma.service';
import { FoundationsService } from './foundations.service';

describe('FoundationsService', () => {
  let service: FoundationsService;
  let prisma: {
    transmissionLine: { findUnique: jest.Mock };
    foundationVolume: { findMany: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      transmissionLine: { findUnique: jest.fn() },
      foundationVolume: { findMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FoundationsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<FoundationsService>(FoundationsService);
  });

  it('deve ser instanciado', () => {
    expect(service).toBeDefined();
  });

  it('deve lançar NotFoundException se a linha de transmissão não existir', async () => {
    prisma.transmissionLine.findUnique.mockResolvedValue(null);

    await expect(service.calculateFoundationsForLine(999)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('deve calcular quantitativos com torres de estaqueamento e matrizes do banco', async () => {
    prisma.transmissionLine.findUnique.mockResolvedValue({
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
          towerType: { code: 'SL-20' },
          soilType: { code: 'II' },
          foundationType: { code: 'SAP' },
        },
      ],
      preliminaryStakingDistribution: null,
    });

    prisma.foundationVolume.findMany.mockResolvedValue([
      {
        towerTypeId: 1,
        soilTypeId: 2,
        foundationTypeId: 3,
        versions: [
          {
            excavationNormalFootingM3: '20.000',
            concreteFootingsM3: '15.000',
            steelFootingsKg: '1000.00',
          },
        ],
      },
    ]);

    const result = await service.calculateFoundationsForLine(1);

    expect(result).toBeDefined();
    expect(result.summary.totalTowers).toBe(1);
    expect(result.summary.calculatedTowers).toBe(1);
    expect(result.summary.kpis.totalExcavationM3).toBe('21.000'); // 20 + 5%
    expect(result.summary.kpis.totalConcreteM3).toBe('15.750'); // 15 + 5%
    expect(result.summary.kpis.totalSteelKg).toBe('1100.00'); // 1000 + 10%
  });

  it('deve retornar a validação com status e inconsistências da linha', async () => {
    prisma.transmissionLine.findUnique.mockResolvedValue({
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

    prisma.foundationVolume.findMany.mockResolvedValue([]);

    const validation = await service.getLineFoundationValidation(1);

    expect(validation.hasErrors).toBe(true);
    expect(validation.pendingTowers).toBe(1);
  });
});
