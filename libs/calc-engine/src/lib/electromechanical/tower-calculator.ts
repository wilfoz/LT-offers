import { DecimalValue } from '../decimal-value';
import { TowerQuantityItem, TowerTraceabilityDetail } from '@lt-offers/domain';

export interface TowerInputData {
  towerNumber: string;
  stationMeters: string | number;
  towerTypeId: number;
  towerTypeCode: string;
  towerTypeName: string;
  seriesName?: string;
  bodyHeightM: number;
  legExtensionM?: number;
  baseWeightKg: number;
  legWeightKgPerM?: number;
}

export interface TowerCalculationOptions {
  extraPercent?: number; // Padrão RN-10: 0.5%
  sparePercent?: number; // Padrão: 0.0%
}

export interface TowerCalculationResult {
  items: TowerQuantityItem[];
  totalTheoreticalWeightKg: DecimalValue;
  totalExtraWeightKg: DecimalValue;
  totalSpareWeightKg: DecimalValue;
  totalWeightKg: DecimalValue;
  totalWeightTons: DecimalValue;
  traceability: TowerTraceabilityDetail[];
}

export class TowerQuantityCalculator {
  static calculate(
    towers: TowerInputData[],
    options: TowerCalculationOptions = {},
  ): TowerCalculationResult {
    const extraPercent = options.extraPercent ?? 0.5; // RN-10: 0,5%
    const sparePercent = options.sparePercent ?? 0.0;

    const extraRate = DecimalValue.of(extraPercent).dividedBy(DecimalValue.of(100));
    const spareRate = DecimalValue.of(sparePercent).dividedBy(DecimalValue.of(100));

    const groupedMap = new Map<
      string,
      {
        towerTypeId: number;
        towerTypeCode: string;
        towerTypeName: string;
        seriesName?: string;
        heightBodyM: number;
        baseWeightKg: number;
        count: number;
        totalTheoreticalWeight: DecimalValue;
      }
    >();

    const traceability: TowerTraceabilityDetail[] = [];
    let totalTheoretical = DecimalValue.zero();

    for (const t of towers) {
      const legExtM = t.legExtensionM ?? 0;
      const legRateKgPerM = t.legWeightKgPerM ?? 150; // peso aproximado de extensão de perna
      const legWeight = DecimalValue.of(legExtM).times(DecimalValue.of(legRateKgPerM));
      const structureWeight = DecimalValue.of(t.baseWeightKg).plus(legWeight);

      totalTheoretical = totalTheoretical.plus(structureWeight);

      traceability.push({
        towerNumber: t.towerNumber,
        stationMeters: String(t.stationMeters),
        towerTypeCode: t.towerTypeCode,
        heightM: t.bodyHeightM,
        legExtensionM: legExtM,
        nominalWeightKg: t.baseWeightKg,
        legExtensionWeightKg: legWeight.round(2, 'half-up').toNumber(),
        totalStructureWeightKg: structureWeight.round(2, 'half-up').toNumber(),
      });

      const groupKey = `${t.towerTypeId}_${t.bodyHeightM}`;
      const existing = groupedMap.get(groupKey);
      if (existing) {
        existing.count += 1;
        existing.totalTheoreticalWeight = existing.totalTheoreticalWeight.plus(structureWeight);
      } else {
        groupedMap.set(groupKey, {
          towerTypeId: t.towerTypeId,
          towerTypeCode: t.towerTypeCode,
          towerTypeName: t.towerTypeName,
          seriesName: t.seriesName,
          heightBodyM: t.bodyHeightM,
          baseWeightKg: t.baseWeightKg,
          count: 1,
          totalTheoreticalWeight: structureWeight,
        });
      }
    }

    const items: TowerQuantityItem[] = [];
    let grandExtra = DecimalValue.zero();
    let grandSpare = DecimalValue.zero();
    let grandTotalKg = DecimalValue.zero();

    for (const group of groupedMap.values()) {
      const theoretical = group.totalTheoreticalWeight;
      const extra = theoretical.times(extraRate);
      const spare = theoretical.times(spareRate);
      const totalKg = theoretical.plus(extra).plus(spare);
      const totalTons = totalKg.dividedBy(DecimalValue.of(1000));

      grandExtra = grandExtra.plus(extra);
      grandSpare = grandSpare.plus(spare);
      grandTotalKg = grandTotalKg.plus(totalKg);

      items.push({
        towerTypeId: group.towerTypeId,
        towerTypeCode: group.towerTypeCode,
        towerTypeName: group.towerTypeName,
        seriesName: group.seriesName,
        heightBodyM: group.heightBodyM,
        baseWeightKg: group.baseWeightKg,
        count: group.count,
        theoreticalWeightKg: theoretical.round(2, 'half-up').toNumber(),
        extraPercent,
        extraWeightKg: extra.round(2, 'half-up').toNumber(),
        sparePercent,
        spareWeightKg: spare.round(2, 'half-up').toNumber(),
        totalWeightKg: totalKg.round(2, 'half-up').toNumber(),
        totalWeightTons: totalTons.round(3, 'half-up').toNumber(),
      });
    }

    return {
      items,
      totalTheoreticalWeightKg: totalTheoretical.round(2, 'half-up'),
      totalExtraWeightKg: grandExtra.round(2, 'half-up'),
      totalSpareWeightKg: grandSpare.round(2, 'half-up'),
      totalWeightKg: grandTotalKg.round(2, 'half-up'),
      totalWeightTons: grandTotalKg.dividedBy(DecimalValue.of(1000)).round(3, 'half-up'),
      traceability,
    };
  }
}
