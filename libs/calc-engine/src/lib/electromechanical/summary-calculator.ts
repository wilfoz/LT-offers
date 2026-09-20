import { DecimalValue } from '../decimal-value';
import {
  ElectromechanicalSummary,
  ElectromechanicalMaterialItem,
  ElectromechanicalKpis,
  TowerQuantityItem,
  ConductorQuantityItem,
  GroundWireQuantityItem,
  InsulatorQuantityItem,
  GuyWireQuantityItem,
  DamperQuantityItem,
  GroundingQuantityItem,
  WarningMarkerQuantityItem,
  AccessQuantityItem,
  VegetationClearingItem,
  CrossingItem,
} from '@lt-offers/domain';

export interface ElectromechanicalSummaryInput {
  lineId: string;
  lineName: string;
  lineLengthKm: number;
  totalTowers: number;
  towers: TowerQuantityItem[];
  conductors: ConductorQuantityItem[];
  groundWires: GroundWireQuantityItem[];
  insulators: InsulatorQuantityItem[];
  guyWires: GuyWireQuantityItem[];
  dampers: DamperQuantityItem[];
  grounding: GroundingQuantityItem[];
  warningMarkers: WarningMarkerQuantityItem[];
  accesses: AccessQuantityItem[];
  vegetationClearing: VegetationClearingItem[];
  crossings: CrossingItem[];
}

export class ElectromechanicalSummaryCalculator {
  static calculateSummary(
    input: ElectromechanicalSummaryInput,
  ): ElectromechanicalSummary {
    let totTowerSteelTons = DecimalValue.zero();
    for (const t of input.towers) {
      totTowerSteelTons = totTowerSteelTons.plus(
        DecimalValue.of(t.totalWeightTons),
      );
    }

    let totCondKm = DecimalValue.zero();
    let totCondTons = DecimalValue.zero();
    for (const c of input.conductors) {
      totCondKm = totCondKm.plus(DecimalValue.of(c.totalLengthKm));
      totCondTons = totCondTons.plus(DecimalValue.of(c.totalWeightTons));
    }

    let totGwKm = DecimalValue.zero();
    let totGwTons = DecimalValue.zero();
    for (const gw of input.groundWires) {
      totGwKm = totGwKm.plus(DecimalValue.of(gw.totalLengthKm));
      totGwTons = totGwTons.plus(DecimalValue.of(gw.totalWeightTons));
    }

    let totInsUnits = DecimalValue.zero();
    for (const ins of input.insulators) {
      totInsUnits = totInsUnits.plus(DecimalValue.of(ins.totalUnits));
    }

    let totAccessKm = DecimalValue.zero();
    for (const a of input.accesses) {
      totAccessKm = totAccessKm.plus(DecimalValue.of(a.lengthKm));
    }

    let totClearingHa = DecimalValue.zero();
    for (const cl of input.vegetationClearing) {
      totClearingHa = totClearingHa.plus(DecimalValue.of(cl.areaHectares));
    }

    const kpis: ElectromechanicalKpis = {
      totalTowerSteelTons: totTowerSteelTons.round(3, 'half-up').toNumber(),
      totalConductorKm: totCondKm.round(3, 'half-up').toNumber(),
      totalConductorTons: totCondTons.round(3, 'half-up').toNumber(),
      totalGroundWireKm: totGwKm.round(3, 'half-up').toNumber(),
      totalGroundWireTons: totGwTons.round(3, 'half-up').toNumber(),
      totalInsulatorUnits: totInsUnits.round(0, 'half-up').toNumber(),
      totalAccessKm: totAccessKm.round(2, 'half-up').toNumber(),
      totalClearingHectares: totClearingHa.round(2, 'half-up').toNumber(),
    };

    // Consolidar todos os itens para formato compatível com M06 (Cantidades -> Precios)
    const consolidatedMaterials: ElectromechanicalMaterialItem[] = [];

    // 1. Torres
    for (const t of input.towers) {
      consolidatedMaterials.push({
        itemCode: `MAT-TOR-${t.towerTypeCode}`,
        itemName: `Estrutura de Aço Galvanizado ${t.towerTypeName}`,
        family: 'TOWERS',
        unit: 'kg',
        theoreticalQuantity: t.theoreticalWeightKg,
        extraQuantity: t.extraWeightKg,
        spareQuantity: t.spareWeightKg,
        totalQuantity: t.totalWeightKg,
      });
    }

    // 2. Condutores
    for (const c of input.conductors) {
      consolidatedMaterials.push({
        itemCode: `MAT-CAB-${c.cableCode}`,
        itemName: `Cabo Condutor de Alumínio ${c.cableName}`,
        family: 'CONDUCTORS',
        unit: 'km',
        theoreticalQuantity: c.theoreticalLengthKm,
        extraQuantity: c.wasteLengthKm,
        spareQuantity: c.spareLengthKm,
        totalQuantity: c.totalLengthKm,
      });
    }

    // 3. Cabos de Guarda
    for (const gw of input.groundWires) {
      consolidatedMaterials.push({
        itemCode: `MAT-CG-${gw.cableCode}`,
        itemName: `Cabo de Guarda ${gw.type === 'OPGW' ? 'OPGW' : 'de Aço'} ${gw.cableName}`,
        family: 'GROUND_WIRES',
        unit: 'km',
        theoreticalQuantity: gw.theoreticalLengthKm,
        extraQuantity: gw.wasteLengthKm,
        spareQuantity: gw.spareLengthKm,
        totalQuantity: gw.totalLengthKm,
      });
    }

    // 4. Isoladores
    for (const ins of input.insulators) {
      consolidatedMaterials.push({
        itemCode: `MAT-ISO-${ins.typeCode}`,
        itemName: `Conjunto de Isoladores ${ins.typeName}`,
        family: 'INSULATORS',
        unit: 'un',
        theoreticalQuantity: ins.theoreticalUnits,
        extraQuantity: ins.extraUnits,
        spareQuantity: ins.spareUnits,
        totalQuantity: ins.totalUnits,
      });
    }

    // 5. Tirantes
    for (const guy of input.guyWires) {
      consolidatedMaterials.push({
        itemCode: `MAT-TIR-${guy.cableCode}`,
        itemName: `Cabo de Aço para Tirantes ${guy.cableName}`,
        family: 'GUY_WIRES',
        unit: 'm',
        theoreticalQuantity: guy.theoreticalLengthM,
        extraQuantity: guy.extraLengthM,
        spareQuantity: guy.spareLengthM,
        totalQuantity: guy.totalLengthM,
      });
    }

    // 6. Ferragens & Amortecedores
    for (const d of input.dampers) {
      consolidatedMaterials.push({
        itemCode: `MAT-AMORT-${d.cableCode}`,
        itemName: `Amortecedor Stockbridge para Cabo ${d.cableCode}`,
        family: 'HARDWARE_ACCESSORIES',
        unit: 'un',
        theoreticalQuantity: d.theoreticalUnits,
        extraQuantity: d.extraUnits,
        spareQuantity: 0,
        totalQuantity: d.totalUnits,
      });
    }

    // 7. Aterramento
    for (const g of input.grounding) {
      consolidatedMaterials.push({
        itemCode: `MAT-ATER-${g.itemCode}`,
        itemName: `Material de Aterramento ${g.itemName}`,
        family: 'GROUNDING',
        unit: g.unit,
        theoreticalQuantity: g.theoreticalQuantity,
        extraQuantity: DecimalValue.of(g.totalQuantity)
          .minus(DecimalValue.of(g.theoreticalQuantity))
          .round(2, 'half-up')
          .toNumber(),
        spareQuantity: 0,
        totalQuantity: g.totalQuantity,
      });
    }

    return {
      lineId: input.lineId,
      lineName: input.lineName,
      lineLengthKm: input.lineLengthKm,
      totalTowers: input.totalTowers,
      kpis,
      towers: input.towers,
      conductors: input.conductors,
      groundWires: input.groundWires,
      insulators: input.insulators,
      guyWires: input.guyWires,
      dampers: input.dampers,
      grounding: input.grounding,
      warningMarkers: input.warningMarkers,
      accesses: input.accesses,
      vegetationClearing: input.vegetationClearing,
      crossings: input.crossings,
      consolidatedMaterials,
    };
  }
}
