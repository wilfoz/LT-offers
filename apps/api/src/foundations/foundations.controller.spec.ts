import {
  FoundationTraceabilityItem,
  FoundationVolumeQuantityField,
  LineFoundationSummary,
} from '@lt-offers/domain';
import { Test, TestingModule } from '@nestjs/testing';
import { FoundationsController } from './foundations.controller';
import { FoundationsService } from './foundations.service';

describe('FoundationsController', () => {
  let controller: FoundationsController;
  let service: {
    getLineFoundationSummary: jest.Mock;
    getLineFoundationTraceability: jest.Mock;
    getLineFoundationValidation: jest.Mock;
    calculateFoundationsForLine: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      getLineFoundationSummary: jest.fn(),
      getLineFoundationTraceability: jest.fn(),
      getLineFoundationValidation: jest.fn(),
      calculateFoundationsForLine: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FoundationsController],
      providers: [{ provide: FoundationsService, useValue: service }],
    }).compile();

    controller = module.get<FoundationsController>(FoundationsController);
  });

  it('deve delegar getQuantities para o serviço', async () => {
    const mockSummary: LineFoundationSummary = {
      transmissionLineId: 10,
      calculationMode: 'STAKING_DETAILED',
      totalTowers: 5,
      calculatedTowers: 5,
      pendingTowers: 0,
      kpis: {
        totalExcavationM3: '100.000',
        totalConcreteM3: '50.000',
        totalSteelKg: '2000.00',
        totalBackfillM3: '50.000',
        totalSpecialPilesM: '0.000',
      },
      materials: [],
      materialsByFamily: {
        EXCAVATION: [],
        CONCRETE: [],
        STEEL: [],
        BACKFILL_FORMWORK: [],
        SPECIAL_FOUNDATIONS: [],
      },
      missingCombinations: [],
    };
    service.getLineFoundationSummary.mockResolvedValue(mockSummary);

    const result = await controller.getQuantities(10);
    expect(result).toBe(mockSummary);
    expect(service.getLineFoundationSummary).toHaveBeenCalledWith(10);
  });

  it('deve delegar getTraceability para o serviço', async () => {
    const mockTrace = {
      excavationHardFootingM3: {
        field: 'excavationHardFootingM3',
        name: 'Escavação em Terreno Duro',
        unit: 'm³',
        totalQuantity: '22.000',
        towersCount: 2,
        towerDetails: [],
      },
    } as unknown as Record<
      FoundationVolumeQuantityField,
      FoundationTraceabilityItem
    >;
    service.getLineFoundationTraceability.mockResolvedValue(mockTrace);

    const result = await controller.getTraceability(10);
    expect(result).toBe(mockTrace);
    expect(service.getLineFoundationTraceability).toHaveBeenCalledWith(10);
  });

  it('deve delegar getValidation para o serviço', async () => {
    const mockVal = {
      transmissionLineId: 10,
      totalTowers: 5,
      calculatedTowers: 5,
      pendingTowers: 0,
      hasErrors: false,
      missingCombinations: [],
    };
    service.getLineFoundationValidation.mockResolvedValue(mockVal);

    const result = await controller.getValidation(10);
    expect(result).toBe(mockVal);
    expect(service.getLineFoundationValidation).toHaveBeenCalledWith(10);
  });
});
