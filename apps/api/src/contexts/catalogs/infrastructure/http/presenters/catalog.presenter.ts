import {
  ConductorCableHistory,
  ConductorCableSummary,
  ConductorCableVersion,
  GroundWireHistory,
  GroundWireSummary,
  GroundWireVersion,
  GuyWireHistory,
  GuyWireSummary,
  GuyWireVersion,
  InsulatorHistory,
  InsulatorSummary,
  InsulatorVersion,
  StructureSeriesHistory,
  StructureSeriesSummary,
  StructureSeriesVersion,
  TowerTypeHistory,
  TowerTypeSummary,
  TowerTypeVersion,
  SoilTypeHistory,
  SoilTypeSummary,
  SoilTypeVersion,
  FoundationTypeHistory,
  FoundationTypeSummary,
  FoundationTypeVersion,
  FoundationVolumeHistory,
  FoundationVolumeSummary,
  FoundationVolumeVersion,
  FixedCostHistory,
  FixedCostSummary,
  FixedCostVersion,
  EquipmentHistory,
  EquipmentSummary,
  EquipmentVersion,
  LaborRoleHistory,
  LaborRoleSummary,
  LaborRoleVersion,
  WorkCrewHistory,
  WorkCrewSummary,
  WorkCrewVersion,
} from '@lt-offers/domain';
import {
  CivilDate,
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

export class CatalogPresenter {
  // Cables
  static toConductorCableVersion(
    v: ConductorCableVersionEntity,
  ): ConductorCableVersion {
    return {
      id: v.id ?? 0,
      description: v.description,
      weightTonPerKm: v.weightTonPerKm,
      reelLengthM: v.reelLengthM,
      diameterMm: v.diameterMm,
      utsKn: v.utsKn,
      effectiveFrom: v.effectivePeriod.effectiveFrom.toISOString(),
      createdBy: v.createdBy,
      createdAt: v.createdAt.toISOString(),
    };
  }

  static toConductorCableSummary(
    entity: ConductorCableEntity,
    referenceDate: CivilDate,
  ): ConductorCableSummary {
    const effective = entity.getEffectiveVersion(referenceDate);
    return {
      id: entity.id,
      code: entity.code,
      effectiveVersion: effective
        ? this.toConductorCableVersion(effective)
        : null,
      pendingFields: effective ? effective.getPendingFields() : [],
    };
  }

  static toConductorCableHistory(
    entity: ConductorCableEntity,
  ): ConductorCableHistory {
    const versions = [...entity.versions]
      .sort(
        (a, b) =>
          b.effectivePeriod.effectiveFrom.getTime() -
          a.effectivePeriod.effectiveFrom.getTime(),
      )
      .map((v) => this.toConductorCableVersion(v));
    return { id: entity.id, code: entity.code, versions };
  }

  // Ground Wires
  static toGroundWireVersion(v: GroundWireVersionEntity): GroundWireVersion {
    return {
      id: v.id ?? 0,
      description: v.description,
      weightTonPerKm: v.weightTonPerKm,
      reelLengthM: v.reelLengthM,
      diameterMm: v.diameterMm,
      utsKn: v.utsKn,
      galvanizationClass: v.galvanizationClass,
      strengthGrade: v.strengthGrade,
      wireCount: v.wireCount,
      manufacturer: v.manufacturer,
      i2tKa2s: v.i2tKa2s,
      fiberCount: v.fiberCount,
      effectiveFrom: v.effectivePeriod.effectiveFrom.toISOString(),
      createdBy: v.createdBy,
      createdAt: v.createdAt.toISOString(),
    };
  }

  static toGroundWireSummary(
    entity: GroundWireEntity,
    referenceDate: CivilDate,
  ): GroundWireSummary {
    const effective = entity.getEffectiveVersion(referenceDate);
    return {
      id: entity.id,
      code: entity.code,
      type: entity.type as any,
      effectiveVersion: effective ? this.toGroundWireVersion(effective) : null,
      pendingFields: effective ? effective.getPendingFields(entity.type) : [],
    };
  }

  static toGroundWireHistory(entity: GroundWireEntity): GroundWireHistory {
    const versions = [...entity.versions]
      .sort(
        (a, b) =>
          b.effectivePeriod.effectiveFrom.getTime() -
          a.effectivePeriod.effectiveFrom.getTime(),
      )
      .map((v) => this.toGroundWireVersion(v));
    return {
      id: entity.id,
      code: entity.code,
      type: entity.type as any,
      versions,
    };
  }

  // Guy Wires
  static toGuyWireVersion(v: GuyWireVersionEntity): GuyWireVersion {
    return {
      id: v.id ?? 0,
      description: v.description,
      weightTonPerKm: v.weightTonPerKm,
      reelLengthM: v.reelLengthM,
      diameterMm: v.diameterMm,
      utsKn: v.utsKn,
      galvanizationClass: v.galvanizationClass,
      strengthGrade: v.strengthGrade,
      wireCount: v.wireCount,
      effectiveFrom: v.effectivePeriod.effectiveFrom.toISOString(),
      createdBy: v.createdBy,
      createdAt: v.createdAt.toISOString(),
    };
  }

  static toGuyWireSummary(
    entity: GuyWireEntity,
    referenceDate: CivilDate,
  ): GuyWireSummary {
    const effective = entity.getEffectiveVersion(referenceDate);
    return {
      id: entity.id,
      code: entity.code,
      effectiveVersion: effective ? this.toGuyWireVersion(effective) : null,
      pendingFields: effective ? effective.getPendingFields() : [],
    };
  }

  static toGuyWireHistory(entity: GuyWireEntity): GuyWireHistory {
    const versions = [...entity.versions]
      .sort(
        (a, b) =>
          b.effectivePeriod.effectiveFrom.getTime() -
          a.effectivePeriod.effectiveFrom.getTime(),
      )
      .map((v) => this.toGuyWireVersion(v));
    return { id: entity.id, code: entity.code, versions };
  }

  // Insulators
  static toInsulatorVersion(v: InsulatorVersionEntity): InsulatorVersion {
    return {
      id: v.id ?? 0,
      description: v.description,
      type: v.type,
      manufacturer: v.manufacturer,
      profile: v.profile,
      ruptureStrengthKn: v.ruptureStrengthKn,
      diameterMm: v.diameterMm,
      spacingMm: v.spacingMm,
      creepageDistanceMm: v.creepageDistanceMm,
      effectiveFrom: v.effectivePeriod.effectiveFrom.toISOString(),
      createdBy: v.createdBy,
      createdAt: v.createdAt.toISOString(),
    };
  }

  static toInsulatorSummary(
    entity: InsulatorEntity,
    referenceDate: CivilDate,
  ): InsulatorSummary {
    const effective = entity.getEffectiveVersion(referenceDate);
    return {
      id: entity.id,
      code: entity.code,
      effectiveVersion: effective ? this.toInsulatorVersion(effective) : null,
      pendingFields: effective ? effective.getPendingFields() : [],
    };
  }

  static toInsulatorHistory(entity: InsulatorEntity): InsulatorHistory {
    const versions = [...entity.versions]
      .sort(
        (a, b) =>
          b.effectivePeriod.effectiveFrom.getTime() -
          a.effectivePeriod.effectiveFrom.getTime(),
      )
      .map((v) => this.toInsulatorVersion(v));
    return { id: entity.id, code: entity.code, versions };
  }

  // Structures
  static toStructureSeriesVersion(
    v: StructureSeriesVersionEntity,
  ): StructureSeriesVersion {
    return {
      id: v.id ?? 0,
      designer: v.designer,
      voltageKv: v.voltageKv,
      circuitCount: v.circuitCount,
      cablesPerPhase: v.cablesPerPhase,
      designWindSpeedMs: v.designWindSpeedMs,
      insulatorType: v.insulatorType,
      silMw: v.silMw,
      effectiveFrom: v.effectivePeriod.effectiveFrom.toISOString(),
      createdBy: v.createdBy,
      createdAt: v.createdAt.toISOString(),
    };
  }

  static toStructureSeriesSummary(
    entity: StructureSeriesEntity,
    referenceDate: CivilDate,
  ): StructureSeriesSummary {
    const effective = entity.getEffectiveVersion(referenceDate);
    return {
      id: entity.id,
      name: entity.name,
      towerTypeCount: entity.towerTypeCount ?? 0,
      effectiveVersion: effective
        ? this.toStructureSeriesVersion(effective)
        : null,
      pendingFields: effective ? effective.getPendingFields() : [],
    };
  }

  static toStructureSeriesHistory(
    entity: StructureSeriesEntity,
  ): StructureSeriesHistory {
    const versions = [...entity.versions]
      .sort(
        (a, b) =>
          b.effectivePeriod.effectiveFrom.getTime() -
          a.effectivePeriod.effectiveFrom.getTime(),
      )
      .map((v) => this.toStructureSeriesVersion(v));
    return { id: entity.id, name: entity.name, versions };
  }

  // Tower Types
  static toTowerTypeVersion(v: TowerTypeVersionEntity): TowerTypeVersion {
    return {
      id: v.id ?? 0,
      guyCount: v.guyCount,
      weights: v.weights.map((w) => ({
        heightM: w.heightM,
        weightKg: w.weightKg,
      })),
      effectiveFrom: v.effectivePeriod.effectiveFrom.toISOString(),
      createdBy: v.createdBy,
      createdAt: v.createdAt.toISOString(),
    };
  }

  static toTowerTypeSummary(
    entity: TowerTypeEntity,
    referenceDate: CivilDate,
  ): TowerTypeSummary {
    const effective = entity.getEffectiveVersion(referenceDate);
    return {
      id: entity.id,
      code: entity.code,
      function: entity.function as any,
      effectiveVersion: effective ? this.toTowerTypeVersion(effective) : null,
      pendingFields: effective ? effective.getPendingFields() : [],
    };
  }

  static toTowerTypeHistory(entity: TowerTypeEntity): TowerTypeHistory {
    const versions = [...entity.versions]
      .sort(
        (a, b) =>
          b.effectivePeriod.effectiveFrom.getTime() -
          a.effectivePeriod.effectiveFrom.getTime(),
      )
      .map((v) => this.toTowerTypeVersion(v));
    return {
      id: entity.id,
      code: entity.code,
      function: entity.function as any,
      versions,
    };
  }

  // Geotech
  static toSoilTypeVersion(v: SoilTypeVersionEntity): SoilTypeVersion {
    return {
      id: v.id ?? 0,
      description: v.description,
      submerged: v.submerged,
      allowableCompressionStressKgfCm2: v.allowableCompressionStressKgfCm2,
      specificWeightKgfM3: v.specificWeightKgfM3,
      internalFrictionAngleDeg: v.internalFrictionAngleDeg,
      cohesionKgCm2: v.cohesionKgCm2,
      nsptMin: v.nsptMin,
      nsptMax: v.nsptMax,
      effectiveFrom: v.effectivePeriod.effectiveFrom.toISOString(),
      createdBy: v.createdBy,
      createdAt: v.createdAt.toISOString(),
    };
  }

  static toSoilTypeSummary(
    entity: SoilTypeEntity,
    referenceDate: CivilDate,
  ): SoilTypeSummary {
    const effective = entity.getEffectiveVersion(referenceDate);
    return {
      id: entity.id,
      code: entity.code,
      effectiveVersion: effective ? this.toSoilTypeVersion(effective) : null,
      pendingFields: effective ? effective.getPendingFields() : [],
    };
  }

  static toSoilTypeHistory(entity: SoilTypeEntity): SoilTypeHistory {
    const versions = [...entity.versions]
      .sort(
        (a, b) =>
          b.effectivePeriod.effectiveFrom.getTime() -
          a.effectivePeriod.effectiveFrom.getTime(),
      )
      .map((v) => this.toSoilTypeVersion(v));
    return { id: entity.id, code: entity.code, versions };
  }

  // Foundation Types
  static toFoundationTypeVersion(
    v: FoundationTypeVersionEntity,
  ): FoundationTypeVersion {
    return {
      id: v.id ?? 0,
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
      effectiveFrom: v.effectivePeriod.effectiveFrom.toISOString(),
      createdBy: v.createdBy,
      createdAt: v.createdAt.toISOString(),
    };
  }

  static toFoundationTypeSummary(
    entity: FoundationTypeEntity,
    referenceDate: CivilDate,
  ): FoundationTypeSummary {
    const effective = entity.getEffectiveVersion(referenceDate);
    return {
      id: entity.id,
      code: entity.code,
      application: entity.application as any,
      effectiveVersion: effective
        ? this.toFoundationTypeVersion(effective)
        : null,
      pendingFields: effective ? effective.getPendingFields() : [],
    };
  }

  static toFoundationTypeHistory(
    entity: FoundationTypeEntity,
  ): FoundationTypeHistory {
    const versions = [...entity.versions]
      .sort(
        (a, b) =>
          b.effectivePeriod.effectiveFrom.getTime() -
          a.effectivePeriod.effectiveFrom.getTime(),
      )
      .map((v) => this.toFoundationTypeVersion(v));
    return {
      id: entity.id,
      code: entity.code,
      application: entity.application as any,
      versions,
    };
  }

  // Foundation Volumes
  static toFoundationVolumeVersion(
    v: FoundationVolumeVersionEntity,
  ): FoundationVolumeVersion {
    return {
      id: v.id ?? 0,
      ...v.getQuantities(),
      effectiveFrom: v.effectivePeriod.effectiveFrom.toISOString(),
      createdBy: v.createdBy,
      createdAt: v.createdAt.toISOString(),
    };
  }

  static toFoundationVolumeSummary(
    entity: FoundationVolumeEntity,
    referenceDate: CivilDate,
  ): FoundationVolumeSummary {
    const effective = entity.getEffectiveVersion(referenceDate);
    return {
      id: entity.id,
      combination: entity.combination as any,
      effectiveVersion: effective
        ? this.toFoundationVolumeVersion(effective)
        : null,
      pendingFields: effective ? effective.getPendingFields() : [],
    };
  }

  static toFoundationVolumeHistory(
    entity: FoundationVolumeEntity,
  ): FoundationVolumeHistory {
    const versions = [...entity.versions]
      .sort(
        (a, b) =>
          b.effectivePeriod.effectiveFrom.getTime() -
          a.effectivePeriod.effectiveFrom.getTime(),
      )
      .map((v) => this.toFoundationVolumeVersion(v));
    return {
      id: entity.id,
      combination: entity.combination as any,
      versions,
    };
  }

  // Operational
  static toFixedCostVersion(v: FixedCostVersionEntity): FixedCostVersion {
    return {
      id: v.id ?? 0,
      unitCost: v.unitCost,
      unit: v.unit,
      effectiveFrom: v.effectivePeriod.effectiveFrom.toISOString(),
      createdBy: v.createdBy,
      createdAt: v.createdAt.toISOString(),
    };
  }

  static toFixedCostSummary(
    entity: FixedCostEntity,
    referenceDate: CivilDate,
  ): FixedCostSummary {
    const effective = entity.getEffectiveVersion(referenceDate);
    return {
      id: entity.id,
      code: entity.code,
      description: entity.description,
      category: entity.category as any,
      effectiveVersion: effective ? this.toFixedCostVersion(effective) : null,
      pendingFields: effective ? effective.getPendingFields() : [],
    };
  }

  static toFixedCostHistory(entity: FixedCostEntity): FixedCostHistory {
    const versions = [...entity.versions]
      .sort(
        (a, b) =>
          b.effectivePeriod.effectiveFrom.getTime() -
          a.effectivePeriod.effectiveFrom.getTime(),
      )
      .map((v) => this.toFixedCostVersion(v));
    return {
      id: entity.id,
      code: entity.code,
      description: entity.description,
      category: entity.category as any,
      versions,
    };
  }

  // Equipment
  static toEquipmentVersion(v: EquipmentVersionEntity): EquipmentVersion {
    return {
      id: v.id ?? 0,
      externalRentalMonthly: v.externalRentalMonthly,
      internalRentalMonthly: v.internalRentalMonthly,
      purchasePrice: v.purchasePrice,
      depreciationYears: v.depreciationYears,
      ownedAvailabilityCount: v.ownedAvailabilityCount,
      fuelMaintenanceMonthly: v.fuelMaintenanceMonthly,
      effectiveFrom: v.effectivePeriod.effectiveFrom.toISOString(),
      createdBy: v.createdBy,
      createdAt: v.createdAt.toISOString(),
    };
  }

  static toEquipmentSummary(
    entity: EquipmentEntity,
    referenceDate: CivilDate,
  ): EquipmentSummary {
    const effective = entity.getEffectiveVersion(referenceDate);
    return {
      id: entity.id,
      code: entity.code,
      description: entity.description,
      category: entity.category,
      effectiveVersion: effective ? this.toEquipmentVersion(effective) : null,
      pendingFields: entity.getPendingFields(effective),
    };
  }

  static toEquipmentHistory(entity: EquipmentEntity): EquipmentHistory {
    const versions = [...entity.versions]
      .sort(
        (a, b) =>
          b.effectivePeriod.effectiveFrom.getTime() -
          a.effectivePeriod.effectiveFrom.getTime(),
      )
      .map((v) => this.toEquipmentVersion(v));
    return {
      id: entity.id,
      code: entity.code,
      description: entity.description,
      category: entity.category,
      versions,
    };
  }

  // Labor Roles
  static toLaborRoleVersion(v: LaborRoleVersionEntity): LaborRoleVersion {
    return {
      id: v.id ?? 0,
      baseSalary: v.baseSalary,
      hazardPayPercent: v.hazardPayPercent,
      overtimePercent: v.overtimePercent,
      dsrOvertimePercent: v.dsrOvertimePercent,
      socialChargesPercent: v.socialChargesPercent,
      foodAllowanceMonthly: v.foodAllowanceMonthly,
      housingMonthly: v.housingMonthly,
      homeLeaveTravelMonthly: v.homeLeaveTravelMonthly,
      healthInsuranceMonthly: v.healthInsuranceMonthly,
      lifeInsuranceMonthly: v.lifeInsuranceMonthly,
      effectiveFrom: v.effectivePeriod.effectiveFrom.toISOString(),
      createdBy: v.createdBy,
      createdAt: v.createdAt.toISOString(),
    };
  }

  static toLaborRoleSummary(
    entity: LaborRoleEntity,
    referenceDate: CivilDate,
  ): LaborRoleSummary {
    const effective = entity.getEffectiveVersion(referenceDate);
    return {
      id: entity.id,
      code: entity.code,
      name: entity.name,
      effectiveVersion: effective ? this.toLaborRoleVersion(effective) : null,
      pendingFields: effective ? effective.getPendingFields() : [],
    };
  }

  static toLaborRoleHistory(entity: LaborRoleEntity): LaborRoleHistory {
    const versions = [...entity.versions]
      .sort(
        (a, b) =>
          b.effectivePeriod.effectiveFrom.getTime() -
          a.effectivePeriod.effectiveFrom.getTime(),
      )
      .map((v) => this.toLaborRoleVersion(v));
    return { id: entity.id, code: entity.code, name: entity.name, versions };
  }

  // Work Crews
  static toWorkCrewVersion(v: WorkCrewVersionEntity): WorkCrewVersion {
    return {
      id: v.id ?? 0,
      standardProductionRate: v.standardProductionRate,
      productionUnit: v.productionUnit,
      productionPeriod: v.productionPeriod as any,
      laborRoles: v.laborRoles.map((lr) => ({
        laborRoleId: lr.laborRoleId,
        laborRoleCode: lr.laborRoleCode,
        laborRoleName: lr.laborRoleName,
        quantity: lr.quantity,
      })),
      equipments: v.equipments.map((eq) => ({
        equipmentId: eq.equipmentId,
        equipmentCode: eq.equipmentCode,
        equipmentDescription: eq.equipmentDescription,
        quantity: eq.quantity,
      })),
      effectiveFrom: v.effectivePeriod.effectiveFrom.toISOString(),
      createdBy: v.createdBy,
      createdAt: v.createdAt.toISOString(),
    };
  }

  static toWorkCrewSummary(
    entity: WorkCrewEntity,
    referenceDate: CivilDate,
  ): WorkCrewSummary {
    const effective = entity.getEffectiveVersion(referenceDate);
    return {
      id: entity.id,
      code: entity.code,
      name: entity.name,
      laborRoleCount: effective ? effective.laborRoles.length : 0,
      equipmentCount: effective ? effective.equipments.length : 0,
      effectiveVersion: effective ? this.toWorkCrewVersion(effective) : null,
      pendingFields: effective ? effective.getPendingFields() : [],
    };
  }

  static toWorkCrewHistory(entity: WorkCrewEntity): WorkCrewHistory {
    const versions = [...entity.versions]
      .sort(
        (a, b) =>
          b.effectivePeriod.effectiveFrom.getTime() -
          a.effectivePeriod.effectiveFrom.getTime(),
      )
      .map((v) => this.toWorkCrewVersion(v));
    return { id: entity.id, code: entity.code, name: entity.name, versions };
  }
}
