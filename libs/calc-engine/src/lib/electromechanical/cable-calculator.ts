import { DecimalValue } from '../decimal-value';
import { ConductorQuantityItem, GroundWireQuantityItem } from '@lt-offers/domain';

export interface ConductorInputData {
  cableCode: string;
  cableName: string;
  nominalSectionMm2: number;
  weightKgPerKm: number;
  circuits: number;
  phasesPerCircuit?: number; // default 3
  subconductorsPerPhase: number;
  routeLengthKm: number;
  sagFactorPercent?: number; // default 2.5% (RN-11)
  wasteFactorPercent?: number; // default 3.0% (RN-10)
  sparePercent?: number; // default 0.0%
}

export interface GroundWireInputData {
  cableCode: string;
  cableName: string;
  type: 'STEEL' | 'OPGW';
  weightKgPerKm: number;
  routeLengthKm: number;
  sagFactorPercent?: number; // default 1.5%
  splicingTowersCount?: number;
  downleadPerTowerM?: number; // default 40m
  wasteFactorPercent?: number; // default 3.0%
  sparePercent?: number; // default 0.0%
  fiberCount?: number;
}

export interface CableCalculationResult {
  conductors: ConductorQuantityItem[];
  groundWires: GroundWireQuantityItem[];
  totalConductorKm: DecimalValue;
  totalConductorTons: DecimalValue;
  totalGroundWireKm: DecimalValue;
  totalGroundWireTons: DecimalValue;
}

export class CableQuantityCalculator {
  static calculateConductors(conductors: ConductorInputData[]): ConductorQuantityItem[] {
    return conductors.map((c) => {
      const phases = c.phasesPerCircuit ?? 3;
      const sagPct = c.sagFactorPercent ?? 2.5; // RN-11
      const wastePct = c.wasteFactorPercent ?? 3.0; // RN-10
      const sparePct = c.sparePercent ?? 0.0;

      const numPhases = DecimalValue.of(c.circuits).times(DecimalValue.of(phases)).times(DecimalValue.of(c.subconductorsPerPhase));
      const sagMultiplier = DecimalValue.of(1).plus(DecimalValue.of(sagPct).dividedBy(DecimalValue.of(100)));
      
      const theoreticalKm = DecimalValue.of(c.routeLengthKm).times(numPhases).times(sagMultiplier);
      const wasteKm = theoreticalKm.times(DecimalValue.of(wastePct).dividedBy(DecimalValue.of(100)));
      const spareKm = theoreticalKm.times(DecimalValue.of(sparePct).dividedBy(DecimalValue.of(100)));
      const totalKm = theoreticalKm.plus(wasteKm).plus(spareKm);
      const totalTons = totalKm.times(DecimalValue.of(c.weightKgPerKm)).dividedBy(DecimalValue.of(1000));

      return {
        cableCode: c.cableCode,
        cableName: c.cableName,
        nominalSectionMm2: c.nominalSectionMm2,
        weightKgPerKm: c.weightKgPerKm,
        circuits: c.circuits,
        phasesPerCircuit: phases,
        subconductorsPerPhase: c.subconductorsPerPhase,
        routeLengthKm: c.routeLengthKm,
        sagFactorPercent: sagPct,
        theoreticalLengthKm: theoreticalKm.round(3, 'half-up').toNumber(),
        wasteFactorPercent: wastePct,
        wasteLengthKm: wasteKm.round(3, 'half-up').toNumber(),
        sparePercent: sparePct,
        spareLengthKm: spareKm.round(3, 'half-up').toNumber(),
        totalLengthKm: totalKm.round(3, 'half-up').toNumber(),
        totalWeightTons: totalTons.round(3, 'half-up').toNumber(),
      };
    });
  }

  static calculateGroundWires(groundWires: GroundWireInputData[]): GroundWireQuantityItem[] {
    return groundWires.map((gw) => {
      const sagPct = gw.sagFactorPercent ?? 1.5;
      const wastePct = gw.wasteFactorPercent ?? 3.0;
      const sparePct = gw.sparePercent ?? 0.0;
      const splicingCount = gw.splicingTowersCount ?? 0;
      const downleadM = gw.downleadPerTowerM ?? 40;

      const sagMultiplier = DecimalValue.of(1).plus(DecimalValue.of(sagPct).dividedBy(DecimalValue.of(100)));
      const routeWithSagKm = DecimalValue.of(gw.routeLengthKm).times(sagMultiplier);
      const downleadKm = DecimalValue.of(splicingCount).times(DecimalValue.of(downleadM)).dividedBy(DecimalValue.of(1000));

      const theoreticalKm = routeWithSagKm.plus(downleadKm);
      const wasteKm = theoreticalKm.times(DecimalValue.of(wastePct).dividedBy(DecimalValue.of(100)));
      const spareKm = theoreticalKm.times(DecimalValue.of(sparePct).dividedBy(DecimalValue.of(100)));
      const totalKm = theoreticalKm.plus(wasteKm).plus(spareKm);
      const totalTons = totalKm.times(DecimalValue.of(gw.weightKgPerKm)).dividedBy(DecimalValue.of(1000));

      return {
        cableCode: gw.cableCode,
        cableName: gw.cableName,
        type: gw.type,
        weightKgPerKm: gw.weightKgPerKm,
        routeLengthKm: gw.routeLengthKm,
        sagFactorPercent: sagPct,
        splicingTowersCount: splicingCount,
        downleadPerTowerM: downleadM,
        totalDownleadKm: downleadKm.round(3, 'half-up').toNumber(),
        theoreticalLengthKm: theoreticalKm.round(3, 'half-up').toNumber(),
        wasteFactorPercent: wastePct,
        wasteLengthKm: wasteKm.round(3, 'half-up').toNumber(),
        sparePercent: sparePct,
        spareLengthKm: spareKm.round(3, 'half-up').toNumber(),
        totalLengthKm: totalKm.round(3, 'half-up').toNumber(),
        totalWeightTons: totalTons.round(3, 'half-up').toNumber(),
        fiberCount: gw.fiberCount,
      };
    });
  }

  static calculate(
    conductors: ConductorInputData[],
    groundWires: GroundWireInputData[],
  ): CableCalculationResult {
    const calcConductors = this.calculateConductors(conductors);
    const calcGroundWires = this.calculateGroundWires(groundWires);

    let totCondKm = DecimalValue.zero();
    let totCondTons = DecimalValue.zero();
    for (const c of calcConductors) {
      totCondKm = totCondKm.plus(DecimalValue.of(c.totalLengthKm));
      totCondTons = totCondTons.plus(DecimalValue.of(c.totalWeightTons));
    }

    let totGwKm = DecimalValue.zero();
    let totGwTons = DecimalValue.zero();
    for (const gw of calcGroundWires) {
      totGwKm = totGwKm.plus(DecimalValue.of(gw.totalLengthKm));
      totGwTons = totGwTons.plus(DecimalValue.of(gw.totalWeightTons));
    }

    return {
      conductors: calcConductors,
      groundWires: calcGroundWires,
      totalConductorKm: totCondKm.round(3, 'half-up'),
      totalConductorTons: totCondTons.round(3, 'half-up'),
      totalGroundWireKm: totGwKm.round(3, 'half-up'),
      totalGroundWireTons: totGwTons.round(3, 'half-up'),
    };
  }
}
