import { StakingController } from './staking.controller';
import { StakingService } from './staking.service';

describe('StakingController', () => {
  let controller: StakingController;
  let service: {
    getPaginatedTowers: jest.Mock;
    getTowerById: jest.Mock;
    createTower: jest.Mock;
    updateTower: jest.Mock;
    deleteTower: jest.Mock;
    previewPlsCaddImport: jest.Mock;
    commitPlsCaddImport: jest.Mock;
    batchAssign: jest.Mock;
    getPreliminaryDistribution: jest.Mock;
    savePreliminaryDistribution: jest.Mock;
    validateIntegrity: jest.Mock;
  };

  beforeEach(() => {
    service = {
      getPaginatedTowers: jest.fn(),
      getTowerById: jest.fn(),
      createTower: jest.fn(),
      updateTower: jest.fn(),
      deleteTower: jest.fn(),
      previewPlsCaddImport: jest.fn(),
      commitPlsCaddImport: jest.fn(),
      batchAssign: jest.fn(),
      getPreliminaryDistribution: jest.fn(),
      savePreliminaryDistribution: jest.fn(),
      validateIntegrity: jest.fn(),
    };

    controller = new StakingController(service as unknown as StakingService);
  });

  it('should call getPaginatedTowers on service', async () => {
    service.getPaginatedTowers.mockResolvedValue({
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
    expect(service.getPaginatedTowers).toHaveBeenCalledWith(1, { page: 1 });
    expect(result.totalCount).toBe(0);
  });

  it('should call validateIntegrity on service', async () => {
    service.validateIntegrity.mockResolvedValue({
      hasErrors: false,
      totalTowers: 10,
      unassignedSoilCount: 0,
      unassignedFoundationCount: 0,
      invalidCombinationsCount: 0,
      invalidCombinations: [],
      totalStationLengthKm: '10.000',
      lineRefinedLengthKm: '10.000',
      lengthDiscrepancyKm: null,
    });

    const result = await controller.getIntegritySummary(1);
    expect(service.validateIntegrity).toHaveBeenCalledWith(1);
    expect(result.hasErrors).toBe(false);
  });

  it('should call batchAssign on service', async () => {
    service.batchAssign.mockResolvedValue({ updatedCount: 5 });

    const result = await controller.batchAssign(1, { assignSoilTypeId: 2 });
    expect(service.batchAssign).toHaveBeenCalledWith(1, {
      assignSoilTypeId: 2,
    });
    expect(result.updatedCount).toBe(5);
  });
});
