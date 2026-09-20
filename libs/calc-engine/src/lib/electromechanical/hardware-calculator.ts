import { DecimalValue } from '../decimal-value';
import {
  InsulatorQuantityItem,
  GuyWireQuantityItem,
  DamperQuantityItem,
  GroundingQuantityItem,
  WarningMarkerQuantityItem,
} from '@lt-offers/domain';

export interface InsulatorInputData {
  typeCode: string;
  typeName: string;
  category: 'SUSPENSION' | 'TENSION' | 'POST';
  unit?: 'DISCS' | 'STRINGS' | 'SETS';
  stringsCount: number;
  unitsPerString: number;
  breakageExtraPercent?: number; // default 2.0% (RN-10)
  sparePercent?: number; // default 0.0%
}

export interface GuyWireInputData {
  cableCode: string;
  cableName: string;
  weightKgPerM: number;
  guyedTowersCount: number;
  guysPerTower?: number; // default 4
  averageGuyLengthM: number;
  extraPercent?: number; // default 3.0%
  sparePercent?: number; // default 0.0%
}

export interface DamperInputData {
  cableType: 'CONDUCTOR' | 'GROUND_WIRE';
  cableCode: string;
  dampersPerSpan?: number; // default 2
  totalSpans: number;
  extraPercent?: number; // default 2.0%
}

export interface GroundingInputData {
  itemCode: string;
  itemName: string;
  unit: 'm' | 'un' | 'kg';
  quantityPerTower: number;
  towersCount: number;
  extraPercent?: number; // default 5.0%
}

export interface WarningMarkerInputData {
  itemCode: string;
  itemName: string;
  spansWithMarkers: number;
  markersPerSpan?: number; // default 6
  spareUnits?: number; // default 0
}

export class HardwareQuantityCalculator {
  static calculateInsulators(
    insulators: InsulatorInputData[],
  ): InsulatorQuantityItem[] {
    return insulators.map((ins) => {
      const breakagePct = ins.breakageExtraPercent ?? 2.0; // RN-10
      const sparePct = ins.sparePercent ?? 0.0;
      const theoretical = DecimalValue.of(ins.stringsCount).times(
        DecimalValue.of(ins.unitsPerString),
      );
      const extra = theoretical.times(
        DecimalValue.of(breakagePct).dividedBy(DecimalValue.of(100)),
      );
      const spare = theoretical.times(
        DecimalValue.of(sparePct).dividedBy(DecimalValue.of(100)),
      );
      const total = theoretical.plus(extra).plus(spare);

      return {
        typeCode: ins.typeCode,
        typeName: ins.typeName,
        category: ins.category,
        unit: ins.unit ?? 'DISCS',
        stringsCount: ins.stringsCount,
        unitsPerString: ins.unitsPerString,
        theoreticalUnits: theoretical.round(0, 'half-up').toNumber(),
        breakageExtraPercent: breakagePct,
        extraUnits: extra.round(0, 'half-up').toNumber(),
        sparePercent: sparePct,
        spareUnits: spare.round(0, 'half-up').toNumber(),
        totalUnits: total.round(0, 'half-up').toNumber(),
      };
    });
  }

  static calculateGuyWires(
    guyWires: GuyWireInputData[],
  ): GuyWireQuantityItem[] {
    return guyWires.map((gw) => {
      const guysCount = gw.guysPerTower ?? 4;
      const extraPct = gw.extraPercent ?? 3.0;
      const sparePct = gw.sparePercent ?? 0.0;

      const theoreticalM = DecimalValue.of(gw.guyedTowersCount)
        .times(DecimalValue.of(guysCount))
        .times(DecimalValue.of(gw.averageGuyLengthM));

      const extraM = theoreticalM.times(
        DecimalValue.of(extraPct).dividedBy(DecimalValue.of(100)),
      );
      const spareM = theoreticalM.times(
        DecimalValue.of(sparePct).dividedBy(DecimalValue.of(100)),
      );
      const totalM = theoreticalM.plus(extraM).plus(spareM);
      const totalKg = totalM.times(DecimalValue.of(gw.weightKgPerM));

      return {
        cableCode: gw.cableCode,
        cableName: gw.cableName,
        weightKgPerM: gw.weightKgPerM,
        guyedTowersCount: gw.guyedTowersCount,
        guysPerTower: guysCount,
        averageGuyLengthM: gw.averageGuyLengthM,
        theoreticalLengthM: theoreticalM.round(2, 'half-up').toNumber(),
        extraPercent: extraPct,
        extraLengthM: extraM.round(2, 'half-up').toNumber(),
        sparePercent: sparePct,
        spareLengthM: spareM.round(2, 'half-up').toNumber(),
        totalLengthM: totalM.round(2, 'half-up').toNumber(),
        totalWeightKg: totalKg.round(2, 'half-up').toNumber(),
      };
    });
  }

  static calculateDampers(dampers: DamperInputData[]): DamperQuantityItem[] {
    return dampers.map((d) => {
      const perSpan = d.dampersPerSpan ?? 2;
      const extraPct = d.extraPercent ?? 2.0;

      const theoretical = DecimalValue.of(d.totalSpans).times(
        DecimalValue.of(perSpan),
      );
      const extra = theoretical.times(
        DecimalValue.of(extraPct).dividedBy(DecimalValue.of(100)),
      );
      const total = theoretical.plus(extra);

      return {
        cableType: d.cableType,
        cableCode: d.cableCode,
        dampersPerSpan: perSpan,
        totalSpans: d.totalSpans,
        theoreticalUnits: theoretical.round(0, 'half-up').toNumber(),
        extraPercent: extraPct,
        extraUnits: extra.round(0, 'half-up').toNumber(),
        totalUnits: total.round(0, 'half-up').toNumber(),
      };
    });
  }

  static calculateGrounding(
    grounding: GroundingInputData[],
  ): GroundingQuantityItem[] {
    return grounding.map((g) => {
      const extraPct = g.extraPercent ?? 5.0;
      const theoretical = DecimalValue.of(g.towersCount).times(
        DecimalValue.of(g.quantityPerTower),
      );
      const extra = theoretical.times(
        DecimalValue.of(extraPct).dividedBy(DecimalValue.of(100)),
      );
      const total = theoretical.plus(extra);

      return {
        itemCode: g.itemCode,
        itemName: g.itemName,
        unit: g.unit,
        quantityPerTower: g.quantityPerTower,
        towersCount: g.towersCount,
        theoreticalQuantity: theoretical.round(2, 'half-up').toNumber(),
        extraPercent: extraPct,
        totalQuantity: total.round(2, 'half-up').toNumber(),
      };
    });
  }

  static calculateWarningMarkers(
    markers: WarningMarkerInputData[],
  ): WarningMarkerQuantityItem[] {
    return markers.map((m) => {
      const perSpan = m.markersPerSpan ?? 6;
      const spare = m.spareUnits ?? 0;
      const theoretical = DecimalValue.of(m.spansWithMarkers).times(
        DecimalValue.of(perSpan),
      );
      const total = theoretical.plus(DecimalValue.of(spare));

      return {
        itemCode: m.itemCode,
        itemName: m.itemName,
        unit: 'un',
        spansWithMarkers: m.spansWithMarkers,
        markersPerSpan: perSpan,
        theoreticalUnits: theoretical.round(0, 'half-up').toNumber(),
        spareUnits: spare,
        totalUnits: total.round(0, 'half-up').toNumber(),
      };
    });
  }
}
