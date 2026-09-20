import {
  FOUNDATION_VOLUME_QUANTITY_FIELDS,
  FoundationVolumeQuantityField,
  FoundationVolumeQuantities,
  FOUNDATION_QUANTITY_METADATA_MAP,
  FoundationMaterialFamily,
  FoundationMaterialItem,
  FoundationCalculationInput,
  FoundationCalculationResult,
  LineFoundationSummary,
  TowerFoundationCalculationItem,
  TowerFoundationQuantityDetail,
  FoundationTraceabilityItem,
  FoundationTraceabilityTowerDetail,
  MissingFoundationCombination,
  LineFoundationKpis,
} from '@lt-offers/domain';
import { DecimalValue } from '../decimal-value';

/**
 * Cria a chave única da combinação Torre × Solo × Fundação (RN-13).
 */
export function buildCombinationKey(
  towerTypeId: number,
  soilTypeId: number,
  foundationTypeId: number,
): string {
  return `${towerTypeId}:${soilTypeId}:${foundationTypeId}`;
}

/**
 * Formata um valor DecimalValue com o número de casas decimais padrão da grandeza:
 * - Volumes (m³), áreas (m²), comprimentos (m): 3 casas decimais
 * - Massas (kg): 2 casas decimais
 */
export function formatQuantityByUnit(
  value: DecimalValue,
  unit: 'm³' | 'kg' | 'm' | 'm²',
): string {
  const places = unit === 'kg' ? 2 : 3;
  return value.toFixed(places, 'half-up');
}

/**
 * Aplica o fator de desperdício/sobre-escavação (RN-12) sobre uma quantidade teórica.
 */
export function calculateWaste(
  theoretical: DecimalValue,
  wastePercent: number,
): { waste: DecimalValue; total: DecimalValue } {
  if (wastePercent <= 0) {
    return { waste: DecimalValue.zero(), total: theoretical };
  }
  const factor = DecimalValue.of(wastePercent).dividedBy(DecimalValue.of(100));
  const waste = theoretical.times(factor);
  const total = theoretical.plus(waste);
  return { waste, total };
}

/**
 * Motor de Cálculo de Quantitativos de Fundações e Escavações (M05, RN-12, RN-13, RF-20, RF-21, RF-24, RF-26, RF-27).
 * Determinístico (RNF-04), com aritmética decimal de precisão arbitrária (RNF-08) e sem dependência de framework (RNF-16).
 */
export function calculateLineFoundations(
  input: FoundationCalculationInput,
): FoundationCalculationResult {
  // 1. Indexar matrizes de volume por combinação
  const matrixMap = new Map<string, FoundationVolumeQuantities>();
  for (const matrix of input.volumeMatrices) {
    matrixMap.set(
      buildCombinationKey(
        matrix.towerTypeId,
        matrix.soilTypeId,
        matrix.foundationTypeId,
      ),
      matrix.quantities,
    );
  }

  // 2. Inicializar acumuladores de materiais por campo
  type FieldAccumulator = {
    theoretical: DecimalValue;
    waste: DecimalValue;
    total: DecimalValue;
    wastePercent: number;
    towersCount: number;
    details: FoundationTraceabilityTowerDetail[];
  };

  const accumulators = new Map<
    FoundationVolumeQuantityField,
    FieldAccumulator
  >();
  for (const field of FOUNDATION_VOLUME_QUANTITY_FIELDS) {
    const meta = FOUNDATION_QUANTITY_METADATA_MAP[field];
    const customWaste = input.customWasteFactors?.[field];
    const wastePercent =
      customWaste !== undefined
        ? Number(customWaste)
        : meta.defaultWastePercent;

    accumulators.set(field, {
      theoretical: DecimalValue.zero(),
      waste: DecimalValue.zero(),
      total: DecimalValue.zero(),
      wastePercent,
      towersCount: 0,
      details: [],
    });
  }

  const towerCalculations: TowerFoundationCalculationItem[] = [];
  const missingMap = new Map<string, MissingFoundationCombination>();

  let totalTowers = 0;
  let calculatedTowers = 0;
  let pendingTowers = 0;

  // 3. Processar cálculo detalhado por torre (quando houver estaqueamento)
  if (input.towers && input.towers.length > 0) {
    totalTowers = input.towers.length;

    for (const tower of input.towers) {
      const stationStr =
        typeof tower.stationMeters === 'number'
          ? tower.stationMeters.toFixed(2)
          : String(tower.stationMeters);

      // Validação de dados de entrada na torre
      if (!tower.towerTypeId || !tower.soilTypeId || !tower.foundationTypeId) {
        pendingTowers++;
        towerCalculations.push({
          towerId: tower.id,
          towerNumber: tower.towerNumber,
          stationMeters: stationStr,
          towerTypeId: tower.towerTypeId,
          towerCode: tower.towerCode,
          soilTypeId: tower.soilTypeId,
          soilCode: tower.soilCode,
          foundationTypeId: tower.foundationTypeId,
          foundationCode: tower.foundationCode,
          status: 'MISSING_DATA',
          quantities: {},
          notes: ['Dados geotécnicos ou estruturais incompletos'],
        });
        continue;
      }

      const combKey = buildCombinationKey(
        tower.towerTypeId,
        tower.soilTypeId,
        tower.foundationTypeId,
      );
      const matrixQuantities = matrixMap.get(combKey);

      if (!matrixQuantities) {
        pendingTowers++;
        // Registrar combinação ausente para o relatório
        let missingEntry = missingMap.get(combKey);
        if (!missingEntry) {
          missingEntry = {
            towerTypeId: tower.towerTypeId,
            towerCode: tower.towerCode,
            soilTypeId: tower.soilTypeId,
            soilCode: tower.soilCode,
            foundationTypeId: tower.foundationTypeId,
            foundationCode: tower.foundationCode,
            affectedTowersCount: 0,
            affectedTowerNumbers: [],
          };
          missingMap.set(combKey, missingEntry);
        }
        missingEntry.affectedTowersCount++;
        missingEntry.affectedTowerNumbers.push(tower.towerNumber);

        towerCalculations.push({
          towerId: tower.id,
          towerNumber: tower.towerNumber,
          stationMeters: stationStr,
          towerTypeId: tower.towerTypeId,
          towerCode: tower.towerCode,
          soilTypeId: tower.soilTypeId,
          soilCode: tower.soilCode,
          foundationTypeId: tower.foundationTypeId,
          foundationCode: tower.foundationCode,
          status: 'MISSING_COMBINATION',
          quantities: {},
          notes: ['Combinação ausente no catálogo de volumes vigentes'],
        });
        continue;
      }

      // Combinação válida encontrada: calcular quantidades por campo
      calculatedTowers++;
      const towerQtyMap: Partial<
        Record<FoundationVolumeQuantityField, TowerFoundationQuantityDetail>
      > = {};

      for (const field of FOUNDATION_VOLUME_QUANTITY_FIELDS) {
        const rawVal = matrixQuantities[field];
        if (rawVal === null || rawVal === undefined) {
          continue; // Ausência de dado tratada explicitamente (RNF-09)
        }

        const theoreticalVal = DecimalValue.of(rawVal);
        if (theoreticalVal.isZero()) {
          continue; // Zero confirmado
        }

        const acc = accumulators.get(field);
        if (!acc) continue;
        const meta = FOUNDATION_QUANTITY_METADATA_MAP[field];
        const { waste, total } = calculateWaste(
          theoreticalVal,
          acc.wastePercent,
        );

        // Acumular no total da linha
        acc.theoretical = acc.theoretical.plus(theoreticalVal);
        acc.waste = acc.waste.plus(waste);
        acc.total = acc.total.plus(total);
        acc.towersCount++;

        const theoreticalStr = formatQuantityByUnit(theoreticalVal, meta.unit);
        const wasteStr = formatQuantityByUnit(waste, meta.unit);
        const totalStr = formatQuantityByUnit(total, meta.unit);

        towerQtyMap[field] = {
          theoretical: theoreticalStr,
          wasteFactorPercent: acc.wastePercent.toFixed(2),
          waste: wasteStr,
          total: totalStr,
        };

        acc.details.push({
          towerNumber: tower.towerNumber,
          stationMeters: stationStr,
          towerCode: tower.towerCode || `T-${tower.towerTypeId}`,
          soilCode: tower.soilCode || `S-${tower.soilTypeId}`,
          foundationCode: tower.foundationCode || `F-${tower.foundationTypeId}`,
          theoreticalUnit: theoreticalStr,
          wastePercent: acc.wastePercent.toFixed(2),
          totalUnit: totalStr,
        });
      }

      towerCalculations.push({
        towerId: tower.id,
        towerNumber: tower.towerNumber,
        stationMeters: stationStr,
        towerTypeId: tower.towerTypeId,
        towerCode: tower.towerCode,
        soilTypeId: tower.soilTypeId,
        soilCode: tower.soilCode,
        foundationTypeId: tower.foundationTypeId,
        foundationCode: tower.foundationCode,
        status: 'CALCULATED',
        quantities: towerQtyMap,
      });
    }
  } else if (input.preliminaryDistribution) {
    // 4. Processar cálculo preliminar por distribuição percentual (RF-21)
    const {
      totalTowers: nTowers,
      soilPercentages,
      foundationPercentages,
      defaultTowerTypeId,
    } = input.preliminaryDistribution;
    totalTowers = nTowers;
    const defaultTowerId = defaultTowerTypeId || 1;

    for (const s of soilPercentages) {
      const sPerc = DecimalValue.of(s.percentage).dividedBy(
        DecimalValue.of(100),
      );
      for (const f of foundationPercentages) {
        const fPerc = DecimalValue.of(f.percentage).dividedBy(
          DecimalValue.of(100),
        );
        const proportion = sPerc.times(fPerc);
        const structureCount = DecimalValue.of(nTowers).times(proportion);

        if (structureCount.isZero()) continue;

        const combKey = buildCombinationKey(defaultTowerId, s.id, f.id);
        const matrixQuantities = matrixMap.get(combKey);

        if (!matrixQuantities) {
          if (!missingMap.has(combKey)) {
            missingMap.set(combKey, {
              towerTypeId: defaultTowerId,
              towerCode: `T-${defaultTowerId}`,
              soilTypeId: s.id,
              soilCode: `S-${s.id}`,
              foundationTypeId: f.id,
              foundationCode: `F-${f.id}`,
              affectedTowersCount: structureCount
                .round(0, 'half-up')
                .toNumber(),
              affectedTowerNumbers: ['Distribuição Preliminar'],
            });
          }
          continue;
        }

        calculatedTowers = totalTowers;

        for (const field of FOUNDATION_VOLUME_QUANTITY_FIELDS) {
          const rawVal = matrixQuantities[field];
          if (rawVal === null || rawVal === undefined) continue;

          const unitVal = DecimalValue.of(rawVal);
          if (unitVal.isZero()) continue;

          const theoreticalVal = unitVal.times(structureCount);
          const acc = accumulators.get(field);
          if (!acc) continue;
          const { waste, total } = calculateWaste(
            theoreticalVal,
            acc.wastePercent,
          );

          acc.theoretical = acc.theoretical.plus(theoreticalVal);
          acc.waste = acc.waste.plus(waste);
          acc.total = acc.total.plus(total);
          acc.towersCount += structureCount.round(0, 'half-up').toNumber();
        }
      }
    }
  }

  // 5. Consolidar materiais por família
  const materials: FoundationMaterialItem[] = [];
  const materialsByFamily: Record<
    FoundationMaterialFamily,
    FoundationMaterialItem[]
  > = {
    EXCAVATION: [],
    CONCRETE: [],
    STEEL: [],
    BACKFILL_FORMWORK: [],
    SPECIAL_FOUNDATIONS: [],
  };

  const traceability = {} as Record<
    FoundationVolumeQuantityField,
    FoundationTraceabilityItem
  >;

  let totalExcavationM3 = DecimalValue.zero();
  let totalConcreteM3 = DecimalValue.zero();
  let totalSteelKg = DecimalValue.zero();
  let totalBackfillM3 = DecimalValue.zero();
  let totalSpecialPilesM = DecimalValue.zero();

  for (const field of FOUNDATION_VOLUME_QUANTITY_FIELDS) {
    const acc = accumulators.get(field);
    if (!acc) continue;
    const meta = FOUNDATION_QUANTITY_METADATA_MAP[field];

    const theoreticalStr = formatQuantityByUnit(acc.theoretical, meta.unit);
    const wasteStr = formatQuantityByUnit(acc.waste, meta.unit);
    const totalStr = formatQuantityByUnit(acc.total, meta.unit);

    const item: FoundationMaterialItem = {
      field,
      code: meta.code,
      name: meta.name,
      family: meta.family,
      unit: meta.unit,
      theoreticalQuantity: theoreticalStr,
      wasteFactorPercent: acc.wastePercent.toFixed(2),
      wasteQuantity: wasteStr,
      totalQuantity: totalStr,
    };

    materials.push(item);
    materialsByFamily[meta.family].push(item);

    // Acumular nos KPIs
    if (meta.family === 'EXCAVATION') {
      totalExcavationM3 = totalExcavationM3.plus(acc.total);
    } else if (meta.family === 'CONCRETE') {
      totalConcreteM3 = totalConcreteM3.plus(acc.total);
    } else if (meta.family === 'STEEL' && meta.unit === 'kg') {
      totalSteelKg = totalSteelKg.plus(acc.total);
    } else if (meta.family === 'BACKFILL_FORMWORK' && meta.unit === 'm³') {
      totalBackfillM3 = totalBackfillM3.plus(acc.total);
    } else if (meta.family === 'SPECIAL_FOUNDATIONS' && meta.unit === 'm') {
      totalSpecialPilesM = totalSpecialPilesM.plus(acc.total);
    }

    // Rastreabilidade por campo
    traceability[field] = {
      field,
      name: meta.name,
      unit: meta.unit,
      totalQuantity: totalStr,
      towersCount: acc.towersCount,
      towerDetails: acc.details,
    };
  }

  const expansionPercent =
    input.soilExpansionPercent !== undefined
      ? Number(input.soilExpansionPercent)
      : 25;
  const compactionPercent =
    input.compactionFactorPercent !== undefined
      ? Number(input.compactionFactorPercent)
      : 15;

  const excessExcavation = totalExcavationM3.greaterThan(totalBackfillM3)
    ? totalExcavationM3.minus(totalBackfillM3)
    : DecimalValue.zero();

  const expansionMultiplier = DecimalValue.of(1).plus(
    DecimalValue.of(expansionPercent).dividedBy(DecimalValue.of(100)),
  );
  const compactionMultiplier = DecimalValue.of(1).plus(
    DecimalValue.of(compactionPercent).dividedBy(DecimalValue.of(100)),
  );

  const totalLooseDisposalM3 = excessExcavation.times(expansionMultiplier);
  const totalCompactedBackfillM3 = totalBackfillM3.times(compactionMultiplier);

  const kpis: LineFoundationKpis = {
    totalExcavationM3: formatQuantityByUnit(totalExcavationM3, 'm³'),
    totalConcreteM3: formatQuantityByUnit(totalConcreteM3, 'm³'),
    totalSteelKg: formatQuantityByUnit(totalSteelKg, 'kg'),
    totalBackfillM3: formatQuantityByUnit(totalBackfillM3, 'm³'),
    totalSpecialPilesM: formatQuantityByUnit(totalSpecialPilesM, 'm'),
    totalLooseDisposalM3: formatQuantityByUnit(totalLooseDisposalM3, 'm³'),
    totalCompactedBackfillM3: formatQuantityByUnit(
      totalCompactedBackfillM3,
      'm³',
    ),
  };

  const summary: LineFoundationSummary = {
    transmissionLineId: input.transmissionLineId,
    calculationMode:
      input.towers && input.towers.length > 0
        ? 'STAKING_DETAILED'
        : 'PRELIMINARY_PARAMETRIC',
    totalTowers,
    calculatedTowers,
    pendingTowers,
    kpis,
    materials,
    materialsByFamily,
    missingCombinations: Array.from(missingMap.values()),
  };

  return {
    summary,
    towerCalculations,
    traceability,
  };
}
