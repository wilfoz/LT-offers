import {
  ConductorCable as PrismaConductorCable,
  ConductorCableVersion as PrismaConductorCableVersion,
  GroundWire as PrismaGroundWire,
  GroundWireVersion as PrismaGroundWireVersion,
  GuyWire as PrismaGuyWire,
  GuyWireVersion as PrismaGuyWireVersion,
  Insulator as PrismaInsulator,
  InsulatorVersion as PrismaInsulatorVersion,
  StructureSeries as PrismaStructureSeries,
  StructureSeriesVersion as PrismaStructureSeriesVersion,
  TowerType as PrismaTowerType,
  TowerTypeVersion as PrismaTowerTypeVersion,
  TowerTypeWeight as PrismaTowerTypeWeight,
  SoilType as PrismaSoilType,
  SoilTypeVersion as PrismaSoilTypeVersion,
  FoundationType as PrismaFoundationType,
  FoundationTypeVersion as PrismaFoundationTypeVersion,
  FoundationVolume as PrismaFoundationVolume,
  FoundationVolumeVersion as PrismaFoundationVolumeVersion,
  FixedCost as PrismaFixedCost,
  FixedCostVersion as PrismaFixedCostVersion,
  Equipment as PrismaEquipment,
  EquipmentVersion as PrismaEquipmentVersion,
  LaborRole as PrismaLaborRole,
  LaborRoleVersion as PrismaLaborRoleVersion,
  WorkCrew as PrismaWorkCrew,
  WorkCrewVersion as PrismaWorkCrewVersion,
  WorkCrewLaborRole as PrismaWorkCrewLaborRole,
  WorkCrewEquipment as PrismaWorkCrewEquipment,
} from '@prisma/client';
import { FOUNDATION_VOLUME_QUANTITY_FIELDS } from '@lt-offers/domain';
import {
  CivilDate,
  EffectivePeriod,
  ConductorCableEntity,
  ConductorCableVersionEntity,
  GroundWireEntity,
  GroundWireVersionEntity,
  GuyWireEntity,
  GuyWireVersionEntity,
  InsulatorEntity,
  InsulatorVersionEntity,
  StructureSeriesEntity,
  StructureSeriesVersionEntity,
  TowerTypeEntity,
  TowerTypeVersionEntity,
  SoilTypeEntity,
  SoilTypeVersionEntity,
  FoundationTypeEntity,
  FoundationTypeVersionEntity,
  FoundationVolumeEntity,
  FoundationVolumeVersionEntity,
  FixedCostEntity,
  FixedCostVersionEntity,
  EquipmentEntity,
  EquipmentVersionEntity,
  LaborRoleEntity,
  LaborRoleVersionEntity,
  WorkCrewEntity,
  WorkCrewVersionEntity,
} from '../../../domain';

export class PrismaCatalogMappers {
  // Cables
  static toConductorCableEntity(
    row: PrismaConductorCable & { versions?: PrismaConductorCableVersion[] },
  ): ConductorCableEntity {
    const versions = (row.versions || []).map(
      (v) =>
        new ConductorCableVersionEntity({
          id: v.id,
          conductorCableId: v.conductorCableId,
          description: v.description,
          weightTonPerKm: v.weightTonPerKm?.toString() ?? null,
          reelLengthM: v.reelLengthM?.toString() ?? null,
          diameterMm: v.diameterMm?.toString() ?? null,
          utsKn: v.utsKn?.toString() ?? null,
          effectivePeriod: new EffectivePeriod(
            CivilDate.fromDate(v.effectiveFrom),
          ),
          createdBy: v.createdBy,
          createdAt: v.createdAt,
        }),
    );
    return new ConductorCableEntity({
      id: row.id,
      code: row.code,
      versions,
    });
  }

  static toGroundWireEntity(
    row: PrismaGroundWire & { versions?: PrismaGroundWireVersion[] },
  ): GroundWireEntity {
    const versions = (row.versions || []).map(
      (v) =>
        new GroundWireVersionEntity({
          id: v.id,
          groundWireId: v.groundWireId,
          description: v.description,
          weightTonPerKm: v.weightTonPerKm?.toString() ?? null,
          reelLengthM: v.reelLengthM?.toString() ?? null,
          diameterMm: v.diameterMm?.toString() ?? null,
          utsKn: v.utsKn?.toString() ?? null,
          galvanizationClass: v.galvanizationClass,
          strengthGrade: v.strengthGrade,
          wireCount: v.wireCount,
          manufacturer: v.manufacturer,
          i2tKa2s: v.i2tKa2s?.toString() ?? null,
          fiberCount: v.fiberCount,
          effectivePeriod: new EffectivePeriod(
            CivilDate.fromDate(v.effectiveFrom),
          ),
          createdBy: v.createdBy,
          createdAt: v.createdAt,
        }),
    );
    return new GroundWireEntity({
      id: row.id,
      code: row.code,
      type: row.type as any,
      versions,
    });
  }

  static toGuyWireEntity(
    row: PrismaGuyWire & { versions?: PrismaGuyWireVersion[] },
  ): GuyWireEntity {
    const versions = (row.versions || []).map(
      (v) =>
        new GuyWireVersionEntity({
          id: v.id,
          guyWireId: v.guyWireId,
          description: v.description,
          weightTonPerKm: v.weightTonPerKm?.toString() ?? null,
          reelLengthM: v.reelLengthM?.toString() ?? null,
          diameterMm: v.diameterMm?.toString() ?? null,
          utsKn: v.utsKn?.toString() ?? null,
          galvanizationClass: v.galvanizationClass,
          strengthGrade: v.strengthGrade,
          wireCount: v.wireCount,
          effectivePeriod: new EffectivePeriod(
            CivilDate.fromDate(v.effectiveFrom),
          ),
          createdBy: v.createdBy,
          createdAt: v.createdAt,
        }),
    );
    return new GuyWireEntity({
      id: row.id,
      code: row.code,
      versions,
    });
  }

  static toInsulatorEntity(
    row: PrismaInsulator & { versions?: PrismaInsulatorVersion[] },
  ): InsulatorEntity {
    const versions = (row.versions || []).map(
      (v) =>
        new InsulatorVersionEntity({
          id: v.id,
          insulatorId: v.insulatorId,
          description: v.description,
          type: v.type,
          manufacturer: v.manufacturer,
          profile: v.profile,
          ruptureStrengthKn: v.ruptureStrengthKn?.toString() ?? null,
          diameterMm: v.diameterMm?.toString() ?? null,
          spacingMm: v.spacingMm?.toString() ?? null,
          creepageDistanceMm: v.creepageDistanceMm?.toString() ?? null,
          effectivePeriod: new EffectivePeriod(
            CivilDate.fromDate(v.effectiveFrom),
          ),
          createdBy: v.createdBy,
          createdAt: v.createdAt,
        }),
    );
    return new InsulatorEntity({
      id: row.id,
      code: row.code,
      versions,
    });
  }

  // Structures
  static toStructureSeriesEntity(
    row: PrismaStructureSeries & {
      versions?: PrismaStructureSeriesVersion[];
      _count?: { towerTypes: number };
      towerTypes?: unknown[];
    },
  ): StructureSeriesEntity {
    const versions = (row.versions || []).map(
      (v) =>
        new StructureSeriesVersionEntity({
          id: v.id,
          structureSeriesId: v.structureSeriesId,
          designer: v.designer,
          voltageKv: v.voltageKv?.toString() ?? null,
          circuitCount: v.circuitCount,
          cablesPerPhase: v.cablesPerPhase,
          designWindSpeedMs: v.designWindSpeedMs?.toString() ?? null,
          insulatorType: v.insulatorType,
          silMw: v.silMw?.toString() ?? null,
          effectivePeriod: new EffectivePeriod(
            CivilDate.fromDate(v.effectiveFrom),
          ),
          createdBy: v.createdBy,
          createdAt: v.createdAt,
        }),
    );
    const towerTypeCount =
      row._count?.towerTypes ?? row.towerTypes?.length ?? 0;
    return new StructureSeriesEntity({
      id: row.id,
      name: row.name,
      towerTypeCount,
      versions,
    });
  }

  static toTowerTypeEntity(
    row: PrismaTowerType & {
      versions?: (PrismaTowerTypeVersion & {
        weights?: PrismaTowerTypeWeight[];
      })[];
    },
  ): TowerTypeEntity {
    const versions = (row.versions || []).map(
      (v) =>
        new TowerTypeVersionEntity({
          id: v.id,
          towerTypeId: v.towerTypeId,
          guyCount: v.guyCount,
          weights: (v.weights || []).map((w) => ({
            heightM: w.heightM.toString(),
            weightKg: w.weightKg.toString(),
          })),
          effectivePeriod: new EffectivePeriod(
            CivilDate.fromDate(v.effectiveFrom),
          ),
          createdBy: v.createdBy,
          createdAt: v.createdAt,
        }),
    );
    return new TowerTypeEntity({
      id: row.id,
      structureSeriesId: row.structureSeriesId,
      code: row.code,
      function: row.function as any,
      versions,
    });
  }

  // Geotech
  static toSoilTypeEntity(
    row: PrismaSoilType & { versions?: PrismaSoilTypeVersion[] },
  ): SoilTypeEntity {
    const versions = (row.versions || []).map(
      (v) =>
        new SoilTypeVersionEntity({
          id: v.id,
          soilTypeId: v.soilTypeId,
          description: v.description,
          submerged: v.submerged,
          allowableCompressionStressKgfCm2:
            v.allowableCompressionStressKgfCm2?.toString() ?? null,
          specificWeightKgfM3: v.specificWeightKgfM3?.toString() ?? null,
          internalFrictionAngleDeg:
            v.internalFrictionAngleDeg?.toString() ?? null,
          cohesionKgCm2: v.cohesionKgCm2?.toString() ?? null,
          nsptMin: v.nsptMin,
          nsptMax: v.nsptMax,
          effectivePeriod: new EffectivePeriod(
            CivilDate.fromDate(v.effectiveFrom),
          ),
          createdBy: v.createdBy,
          createdAt: v.createdAt,
        }),
    );
    return new SoilTypeEntity({
      id: row.id,
      code: row.code,
      versions,
    });
  }

  static toFoundationTypeEntity(
    row: PrismaFoundationType & { versions?: PrismaFoundationTypeVersion[] },
  ): FoundationTypeEntity {
    const versions = (row.versions || []).map(
      (v) =>
        new FoundationTypeVersionEntity({
          id: v.id,
          foundationTypeId: v.foundationTypeId,
          description: v.description,
          spreadFootingCount: v.spreadFootingCount,
          precastMastCount: v.precastMastCount,
          precastGuyCount: v.precastGuyCount,
          straightPierCount: v.straightPierCount,
          belledPierCount: v.belledPierCount,
          slabPierCount: v.slabPierCount,
          straightPierGuyCount: v.straightPierGuyCount,
          belledPierGuyCount: v.belledPierGuyCount,
          rockAnchorCount: v.rockAnchorCount,
          concretePileCount: v.concretePileCount,
          steelPileCount: v.steelPileCount,
          helicalMastCount: v.helicalMastCount,
          helicalGuyCount: v.helicalGuyCount,
          triconeCount: v.triconeCount,
          rootPileCount: v.rootPileCount,
          micropileCount: v.micropileCount,
          continuousAugerPileCount: v.continuousAugerPileCount,
          effectivePeriod: new EffectivePeriod(
            CivilDate.fromDate(v.effectiveFrom),
          ),
          createdBy: v.createdBy,
          createdAt: v.createdAt,
        }),
    );
    return new FoundationTypeEntity({
      id: row.id,
      code: row.code,
      application: row.application as any,
      versions,
    });
  }

  static toFoundationVolumeEntity(
    row: PrismaFoundationVolume & {
      towerType?: any;
      soilType?: any;
      foundationType?: any;
      versions?: PrismaFoundationVolumeVersion[];
    },
  ): FoundationVolumeEntity {
    const versions = (row.versions || []).map((v) => {
      const quantities: any = {};
      for (const field of FOUNDATION_VOLUME_QUANTITY_FIELDS) {
        quantities[field] = (v as any)[field]?.toString() ?? null;
      }
      return new FoundationVolumeVersionEntity({
        id: v.id,
        foundationVolumeId: v.foundationVolumeId,
        ...quantities,
        effectivePeriod: new EffectivePeriod(
          CivilDate.fromDate(v.effectiveFrom),
        ),
        createdBy: v.createdBy,
        createdAt: v.createdAt,
      });
    });

    const combination =
      row.towerType && row.soilType && row.foundationType
        ? {
            towerTypeId: row.towerTypeId,
            seriesName: row.towerType.structureSeries?.name ?? '',
            towerCode: row.towerType.code,
            soilTypeId: row.soilTypeId,
            soilCode: row.soilType.code,
            foundationTypeId: row.foundationTypeId,
            foundationCode: row.foundationType.code,
          }
        : undefined;

    return new FoundationVolumeEntity({
      id: row.id,
      towerTypeId: row.towerTypeId,
      soilTypeId: row.soilTypeId,
      foundationTypeId: row.foundationTypeId,
      combination,
      versions,
    });
  }

  // Operational
  static toFixedCostEntity(
    row: PrismaFixedCost & { versions?: PrismaFixedCostVersion[] },
  ): FixedCostEntity {
    const versions = (row.versions || []).map(
      (v) =>
        new FixedCostVersionEntity({
          id: v.id,
          fixedCostId: v.fixedCostId,
          unitCost: v.unitCost?.toString() ?? null,
          unit: v.unit,
          effectivePeriod: new EffectivePeriod(
            CivilDate.fromDate(v.effectiveFrom),
          ),
          createdBy: v.createdBy,
          createdAt: v.createdAt,
        }),
    );
    return new FixedCostEntity({
      id: row.id,
      code: row.code,
      description: row.description,
      category: row.category as any,
      versions,
    });
  }

  static toEquipmentEntity(
    row: PrismaEquipment & { versions?: PrismaEquipmentVersion[] },
  ): EquipmentEntity {
    const versions = (row.versions || []).map(
      (v) =>
        new EquipmentVersionEntity({
          id: v.id,
          equipmentId: v.equipmentId,
          externalRentalMonthly: v.externalRentalMonthly?.toString() ?? null,
          internalRentalMonthly: v.internalRentalMonthly?.toString() ?? null,
          purchasePrice: v.purchasePrice?.toString() ?? null,
          depreciationYears: v.depreciationYears,
          ownedAvailabilityCount: v.ownedAvailabilityCount,
          fuelMaintenanceMonthly: v.fuelMaintenanceMonthly?.toString() ?? null,
          effectivePeriod: new EffectivePeriod(
            CivilDate.fromDate(v.effectiveFrom),
          ),
          createdBy: v.createdBy,
          createdAt: v.createdAt,
        }),
    );
    return new EquipmentEntity({
      id: row.id,
      code: row.code,
      description: row.description,
      category: row.category,
      versions,
    });
  }

  static toLaborRoleEntity(
    row: PrismaLaborRole & { versions?: PrismaLaborRoleVersion[] },
  ): LaborRoleEntity {
    const versions = (row.versions || []).map(
      (v) =>
        new LaborRoleVersionEntity({
          id: v.id,
          laborRoleId: v.laborRoleId,
          baseSalary: v.baseSalary?.toString() ?? null,
          hazardPayPercent: v.hazardPayPercent?.toString() ?? null,
          overtimePercent: v.overtimePercent?.toString() ?? null,
          dsrOvertimePercent: v.dsrOvertimePercent?.toString() ?? null,
          socialChargesPercent: v.socialChargesPercent?.toString() ?? null,
          foodAllowanceMonthly: v.foodAllowanceMonthly?.toString() ?? null,
          housingMonthly: v.housingMonthly?.toString() ?? null,
          homeLeaveTravelMonthly: v.homeLeaveTravelMonthly?.toString() ?? null,
          healthInsuranceMonthly: v.healthInsuranceMonthly?.toString() ?? null,
          lifeInsuranceMonthly: v.lifeInsuranceMonthly?.toString() ?? null,
          effectivePeriod: new EffectivePeriod(
            CivilDate.fromDate(v.effectiveFrom),
          ),
          createdBy: v.createdBy,
          createdAt: v.createdAt,
        }),
    );
    return new LaborRoleEntity({
      id: row.id,
      code: row.code,
      name: row.name,
      versions,
    });
  }

  static toWorkCrewEntity(
    row: PrismaWorkCrew & {
      versions?: (PrismaWorkCrewVersion & {
        laborRoles?: (PrismaWorkCrewLaborRole & {
          laborRole?: PrismaLaborRole;
        })[];
        equipments?: (PrismaWorkCrewEquipment & {
          equipment?: PrismaEquipment;
        })[];
      })[];
    },
  ): WorkCrewEntity {
    const versions = (row.versions || []).map(
      (v) =>
        new WorkCrewVersionEntity({
          id: v.id,
          workCrewId: v.workCrewId,
          standardProductionRate: v.standardProductionRate?.toString() ?? null,
          productionUnit: v.productionUnit,
          productionPeriod: v.productionPeriod as any,
          laborRoles: (v.laborRoles || []).map((lr) => ({
            laborRoleId: lr.laborRoleId,
            laborRoleCode: lr.laborRole?.code,
            laborRoleName: lr.laborRole?.name,
            quantity: lr.quantity.toString(),
          })),
          equipments: (v.equipments || []).map((eq) => ({
            equipmentId: eq.equipmentId,
            equipmentCode: eq.equipment?.code,
            equipmentDescription: eq.equipment?.description,
            quantity: eq.quantity.toString(),
          })),
          effectivePeriod: new EffectivePeriod(
            CivilDate.fromDate(v.effectiveFrom),
          ),
          createdBy: v.createdBy,
          createdAt: v.createdAt,
        }),
    );
    return new WorkCrewEntity({
      id: row.id,
      code: row.code,
      name: row.name,
      versions,
    });
  }
}
