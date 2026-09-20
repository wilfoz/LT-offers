import {
  FoundationTraceabilityItem,
  FoundationVolumeQuantityField,
  LineFoundationSummary,
} from '@lt-offers/domain';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  FoundationValidationDiagnostic,
  LineFoundationCalculation,
  LineFoundationsNotFoundException,
} from '../../../domain';
import {
  CalculateLineFoundationsUseCase,
  GetLineFoundationSummaryUseCase,
  GetLineFoundationTraceabilityUseCase,
  GetLineFoundationValidationUseCase,
} from '../../../application';
import { FoundationsController } from './foundations.controller';

describe('FoundationsController (Hexagonal Infrastructure Layer)', () => {
  let controller: FoundationsController;
  let calculateUseCase: { execute: jest.Mock };
  let summaryUseCase: { execute: jest.Mock };
  let traceabilityUseCase: { execute: jest.Mock };
  let validationUseCase: { execute: jest.Mock };

  beforeEach(async () => {
    calculateUseCase = { execute: jest.fn() };
    summaryUseCase = { execute: jest.fn() };
    traceabilityUseCase = { execute: jest.fn() };
    validationUseCase = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FoundationsController],
      providers: [
        {
          provide: CalculateLineFoundationsUseCase,
          useValue: calculateUseCase,
        },
        {
          provide: GetLineFoundationSummaryUseCase,
          useValue: summaryUseCase,
        },
        {
          provide: GetLineFoundationTraceabilityUseCase,
          useValue: traceabilityUseCase,
        },
        {
          provide: GetLineFoundationValidationUseCase,
          useValue: validationUseCase,
        },
      ],
    }).compile();

    controller = module.get<FoundationsController>(FoundationsController);
  });

  it('deve delegar getQuantities para GetLineFoundationSummaryUseCase', async () => {
    const mockSummary = {
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
    } as unknown as LineFoundationSummary;

    summaryUseCase.execute.mockResolvedValue(mockSummary);

    const result = await controller.getQuantities(10);
    expect(result).toBe(mockSummary);
    expect(summaryUseCase.execute).toHaveBeenCalledWith(10);
  });

  it('deve lançar NotFoundException em getQuantities quando linha não existir', async () => {
    summaryUseCase.execute.mockRejectedValue(
      new LineFoundationsNotFoundException(999),
    );

    await expect(controller.getQuantities(999)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('deve delegar getTraceability para GetLineFoundationTraceabilityUseCase', async () => {
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

    traceabilityUseCase.execute.mockResolvedValue(mockTrace);

    const result = await controller.getTraceability(10);
    expect(result).toBe(mockTrace);
    expect(traceabilityUseCase.execute).toHaveBeenCalledWith(10);
  });

  it('deve lançar NotFoundException em getTraceability quando linha não existir', async () => {
    traceabilityUseCase.execute.mockRejectedValue(
      new LineFoundationsNotFoundException(999),
    );

    await expect(controller.getTraceability(999)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('deve delegar getValidation para GetLineFoundationValidationUseCase', async () => {
    const mockDiag = FoundationValidationDiagnostic.create({
      transmissionLineId: 10,
      totalTowers: 5,
      calculatedTowers: 5,
      pendingTowers: 0,
      missingCombinations: [],
    });

    validationUseCase.execute.mockResolvedValue(mockDiag);

    const result = await controller.getValidation(10);
    expect(result).toEqual({
      transmissionLineId: 10,
      totalTowers: 5,
      calculatedTowers: 5,
      pendingTowers: 0,
      hasErrors: false,
      missingCombinations: [],
    });
    expect(validationUseCase.execute).toHaveBeenCalledWith(10);
  });

  it('deve lançar NotFoundException em getValidation quando linha não existir', async () => {
    validationUseCase.execute.mockRejectedValue(
      new LineFoundationsNotFoundException(999),
    );

    await expect(controller.getValidation(999)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('deve delegar getFullCalculation para CalculateLineFoundationsUseCase', async () => {
    const mockCalcResult = {
      summary: {
        transmissionLineId: 10,
        calculationMode: 'STAKING_DETAILED',
        totalTowers: 5,
        calculatedTowers: 5,
        pendingTowers: 0,
        kpis: {} as any,
        materials: [],
        materialsByFamily: {} as any,
        missingCombinations: [],
      },
      towerCalculations: [],
      traceability: {} as any,
    };

    const calculationEntity = new LineFoundationCalculation(
      10,
      mockCalcResult as any,
    );
    calculateUseCase.execute.mockResolvedValue(calculationEntity);

    const result = await controller.getFullCalculation(10);
    expect(result).toBe(mockCalcResult);
    expect(calculateUseCase.execute).toHaveBeenCalledWith(10);
  });

  it('deve lançar NotFoundException em getFullCalculation quando linha não existir', async () => {
    calculateUseCase.execute.mockRejectedValue(
      new LineFoundationsNotFoundException(999),
    );

    await expect(controller.getFullCalculation(999)).rejects.toThrow(
      NotFoundException,
    );
  });
});
