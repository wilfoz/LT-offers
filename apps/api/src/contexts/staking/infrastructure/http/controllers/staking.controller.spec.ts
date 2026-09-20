import { StakingController } from './staking.controller';
import {
  GetPaginatedStakingTowersUseCase,
  GetStakingTowerByIdUseCase,
  CreateStakingTowerUseCase,
  UpdateStakingTowerUseCase,
  DeleteStakingTowerUseCase,
  BatchAssignStakingUseCase,
  ValidateStakingIntegrityUseCase,
  GetPreliminaryDistributionUseCase,
  SavePreliminaryDistributionUseCase,
  PreviewPlsCaddImportUseCase,
  CommitPlsCaddImportUseCase,
} from '../../../application';
import { StakingIntegrityReport } from '../../../domain';

describe('StakingController', () => {
  let controller: StakingController;
  let getPaginatedUseCase: jest.Mocked<GetPaginatedStakingTowersUseCase>;
  let getByIdUseCase: jest.Mocked<GetStakingTowerByIdUseCase>;
  let createTowerUseCase: jest.Mocked<CreateStakingTowerUseCase>;
  let updateTowerUseCase: jest.Mocked<UpdateStakingTowerUseCase>;
  let deleteTowerUseCase: jest.Mocked<DeleteStakingTowerUseCase>;
  let batchAssignUseCase: jest.Mocked<BatchAssignStakingUseCase>;
  let validateIntegrityUseCase: jest.Mocked<ValidateStakingIntegrityUseCase>;
  let getPreliminaryDistributionUseCase: jest.Mocked<GetPreliminaryDistributionUseCase>;
  let savePreliminaryDistributionUseCase: jest.Mocked<SavePreliminaryDistributionUseCase>;
  let previewImportUseCase: jest.Mocked<PreviewPlsCaddImportUseCase>;
  let commitImportUseCase: jest.Mocked<CommitPlsCaddImportUseCase>;

  beforeEach(() => {
    getPaginatedUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetPaginatedStakingTowersUseCase>;
    getByIdUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetStakingTowerByIdUseCase>;
    createTowerUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CreateStakingTowerUseCase>;
    updateTowerUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<UpdateStakingTowerUseCase>;
    deleteTowerUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<DeleteStakingTowerUseCase>;
    batchAssignUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<BatchAssignStakingUseCase>;
    validateIntegrityUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<ValidateStakingIntegrityUseCase>;
    getPreliminaryDistributionUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetPreliminaryDistributionUseCase>;
    savePreliminaryDistributionUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<SavePreliminaryDistributionUseCase>;
    previewImportUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<PreviewPlsCaddImportUseCase>;
    commitImportUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CommitPlsCaddImportUseCase>;

    controller = new StakingController(
      getPaginatedUseCase,
      getByIdUseCase,
      createTowerUseCase,
      updateTowerUseCase,
      deleteTowerUseCase,
      batchAssignUseCase,
      validateIntegrityUseCase,
      getPreliminaryDistributionUseCase,
      savePreliminaryDistributionUseCase,
      previewImportUseCase,
      commitImportUseCase,
    );
  });

  it('should call getPaginatedUseCase', async () => {
    getPaginatedUseCase.execute.mockResolvedValue({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 50,
      totalPages: 1,
      summary: {
        totalTowers: 0,
        minStationMeters: '0.00',
        maxStationMeters: '0.00',
        unassignedSoilCount: 0,
        unassignedFoundationCount: 0,
        invalidCombinationsCount: 0,
      },
    });

    const result = await controller.getPaginated(1, { page: 1 });
    expect(getPaginatedUseCase.execute).toHaveBeenCalledWith(1, { page: 1 });
    expect(result.totalCount).toBe(0);
  });

  it('should call validateIntegrityUseCase', async () => {
    validateIntegrityUseCase.execute.mockResolvedValue(
      new StakingIntegrityReport({
        totalTowers: 10,
        unassignedSoilCount: 0,
        unassignedFoundationCount: 0,
        invalidCombinations: [],
        totalStationLengthKm: '10.000',
        lineRefinedLengthKm: '10.000',
        lengthDiscrepancyKm: null,
      }),
    );

    const result = await controller.getIntegritySummary(1);
    expect(validateIntegrityUseCase.execute).toHaveBeenCalledWith(1);
    expect(result.hasErrors).toBe(false);
  });

  it('should call batchAssignUseCase', async () => {
    batchAssignUseCase.execute.mockResolvedValue({ updatedCount: 5 });

    const result = await controller.batchAssign(1, { assignSoilTypeId: 2 });
    expect(batchAssignUseCase.execute).toHaveBeenCalledWith(1, {
      assignSoilTypeId: 2,
    });
    expect(result.updatedCount).toBe(5);
  });
});
