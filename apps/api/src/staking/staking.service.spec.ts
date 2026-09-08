import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../app/prisma.service';
import { StakingService } from './staking.service';

const Decimal = Prisma.Decimal;

describe('StakingService', () => {
  let service: StakingService;
  let prisma: {
    transmissionLine: {
      findUnique: jest.Mock;
    };
    stakingTower: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      deleteMany: jest.Mock;
      count: jest.Mock;
      updateMany: jest.Mock;
    };
    foundationVolume: {
      findMany: jest.Mock;
    };
    preliminaryStakingDistribution: {
      findUnique: jest.Mock;
      upsert: jest.Mock;
    };
    towerType: {
      findMany: jest.Mock;
    };
    soilType: {
      findMany: jest.Mock;
    };
    foundationType: {
      findMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      transmissionLine: {
        findUnique: jest.fn(),
      },
      stakingTower: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        count: jest.fn(),
        updateMany: jest.fn(),
      },
      foundationVolume: {
        findMany: jest.fn(),
      },
      preliminaryStakingDistribution: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
      towerType: {
        findMany: jest.fn(),
      },
      soilType: {
        findMany: jest.fn(),
      },
      foundationType: {
        findMany: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    service = new StakingService(prisma as unknown as PrismaService);
  });

  describe('getPaginatedTowers', () => {
    it('should throw NotFoundException if transmission line does not exist', async () => {
      prisma.transmissionLine.findUnique.mockResolvedValue(null);

      await expect(
        service.getPaginatedTowers(999, { page: 1, pageSize: 50 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return paginated towers and summary statistics', async () => {
      prisma.transmissionLine.findUnique.mockResolvedValue({ id: 1 });
      prisma.stakingTower.findMany
        .mockResolvedValueOnce([
          {
            id: 1,
            transmissionLineId: 1,
            towerNumber: 'T01',
            stationMeters: new Decimal(0),
            bodyExtensionMeters: new Decimal(0),
            deflectionAngleDeg: new Decimal(0),
            lateralOffsetMeters: new Decimal(0),
            utmEast: new Decimal(500000),
            utmNorth: new Decimal(7500000),
            elevationMeters: new Decimal(600),
            towerTypeId: null,
            soilTypeId: 1,
            foundationTypeId: 2,
            accessDifficulty: 'NORMAL',
            notes: null,
            towerType: null,
            soilType: { id: 1, code: 'S1' },
            foundationType: { id: 2, code: 'SAPATA' },
            createdAt: new Date('2026-09-07T12:00:00Z'),
            updatedAt: new Date('2026-09-07T12:00:00Z'),
          },
        ])
        .mockResolvedValueOnce([
          {
            stationMeters: new Decimal(0),
            soilTypeId: 1,
            foundationTypeId: 2,
          },
        ]);
      prisma.stakingTower.count.mockResolvedValue(1);
      prisma.foundationVolume.findMany.mockResolvedValue([
        { soilTypeId: 1, foundationTypeId: 2 },
      ]);

      const result = await service.getPaginatedTowers(1, {
        page: 1,
        pageSize: 50,
      });
      expect(result.totalCount).toBe(1);
      expect(result.items[0].towerNumber).toBe('T01');
      expect(result.summary.invalidCombinationsCount).toBe(0);
      expect(result.summary.unassignedSoilCount).toBe(0);
      expect(result.summary.unassignedFoundationCount).toBe(0);
    });
  });

  describe('createTower', () => {
    it('should throw BadRequestException on duplicate towerNumber', async () => {
      prisma.transmissionLine.findUnique.mockResolvedValue({ id: 1 });
      prisma.stakingTower.findUnique.mockResolvedValue({ id: 5 });

      await expect(
        service.createTower(1, { towerNumber: 'T01', stationMeters: 0 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create tower successfully', async () => {
      prisma.transmissionLine.findUnique.mockResolvedValue({ id: 1 });
      prisma.stakingTower.findUnique.mockResolvedValue(null);
      prisma.stakingTower.create.mockResolvedValue({
        id: 1,
        transmissionLineId: 1,
        towerNumber: 'T01',
        stationMeters: new Decimal(0),
        bodyExtensionMeters: new Decimal(0),
        deflectionAngleDeg: new Decimal(0),
        lateralOffsetMeters: new Decimal(0),
        utmEast: null,
        utmNorth: null,
        elevationMeters: null,
        towerTypeId: null,
        soilTypeId: null,
        foundationTypeId: null,
        accessDifficulty: 'NORMAL',
        notes: null,
        towerType: null,
        soilType: null,
        foundationType: null,
        createdAt: new Date('2026-09-07T12:00:00Z'),
        updatedAt: new Date('2026-09-07T12:00:00Z'),
      });

      const result = await service.createTower(1, {
        towerNumber: 'T01',
        stationMeters: 0,
      });
      expect(result.towerNumber).toBe('T01');
      expect(result.stationMeters).toBe('0.00');
    });
  });

  describe('savePreliminaryDistribution', () => {
    it('should throw BadRequestException if soil sum is not 100%', async () => {
      prisma.transmissionLine.findUnique.mockResolvedValue({ id: 1 });

      await expect(
        service.savePreliminaryDistribution(1, {
          soilPercentages: [{ id: 1, percentage: '60.00' }],
          foundationPercentages: [{ id: 1, percentage: '100.00' }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if foundation sum is not 100%', async () => {
      prisma.transmissionLine.findUnique.mockResolvedValue({ id: 1 });

      await expect(
        service.savePreliminaryDistribution(1, {
          soilPercentages: [{ id: 1, percentage: '100.00' }],
          foundationPercentages: [{ id: 1, percentage: '90.00' }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should save preliminary distribution successfully', async () => {
      prisma.transmissionLine.findUnique.mockResolvedValue({ id: 1 });
      prisma.preliminaryStakingDistribution.upsert.mockResolvedValue({
        id: 10,
        transmissionLineId: 1,
        soilPercentages: [{ id: 1, percentage: '100.00' }],
        foundationPercentages: [{ id: 2, percentage: '100.00' }],
        createdAt: new Date('2026-09-07T12:00:00Z'),
        updatedAt: new Date('2026-09-07T12:00:00Z'),
      });

      const result = await service.savePreliminaryDistribution(1, {
        soilPercentages: [{ id: 1, percentage: '100.00' }],
        foundationPercentages: [{ id: 2, percentage: '100.00' }],
      });

      expect(result.id).toBe(10);
      expect(result.soilPercentages[0].percentage).toBe('100.00');
    });
  });

  describe('batchAssign', () => {
    it('should update towers in batch matching query', async () => {
      prisma.transmissionLine.findUnique.mockResolvedValue({ id: 1 });
      prisma.stakingTower.updateMany.mockResolvedValue({ count: 12 });

      const result = await service.batchAssign(1, {
        startStationMeters: 0,
        endStationMeters: 5000,
        assignSoilTypeId: 3,
      });

      expect(result.updatedCount).toBe(12);
      expect(prisma.stakingTower.updateMany).toHaveBeenCalled();
    });
  });

  describe('validateIntegrity', () => {
    it('should identify missing soils, missing foundations and invalid catalog combinations (RN-13)', async () => {
      prisma.transmissionLine.findUnique.mockResolvedValue({
        id: 1,
        refinedLengthKm: new Decimal(10),
      });

      prisma.stakingTower.findMany.mockResolvedValue([
        {
          towerNumber: 'T01',
          stationMeters: new Decimal(0),
          soilTypeId: null,
          foundationTypeId: null,
          soilType: null,
          foundationType: null,
        },
        {
          towerNumber: 'T02',
          stationMeters: new Decimal(500),
          soilTypeId: 1,
          foundationTypeId: 99,
          soilType: { code: 'S1' },
          foundationType: { code: 'TUBULAO' },
        },
      ]);

      prisma.foundationVolume.findMany.mockResolvedValue([
        { soilTypeId: 1, foundationTypeId: 1 }, // S1:1 exists, but S1:99 does not
      ]);

      const result = await service.validateIntegrity(1);
      expect(result.hasErrors).toBe(true);
      expect(result.unassignedSoilCount).toBe(1);
      expect(result.unassignedFoundationCount).toBe(1);
      expect(result.invalidCombinationsCount).toBe(1);
      expect(result.invalidCombinations[0].towerNumber).toBe('T02');
      expect(result.invalidCombinations[0].soilCode).toBe('S1');
      expect(result.invalidCombinations[0].foundationCode).toBe('TUBULAO');
    });
  });
});
