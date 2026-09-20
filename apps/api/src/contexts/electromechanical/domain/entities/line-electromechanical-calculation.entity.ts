import { ElectromechanicalSummary } from '@lt-offers/domain';

/**
 * Entidade de Domínio que encapsula o resultado do cálculo de quantitativos eletromecânicos de uma LT.
 */
export class LineElectromechanicalCalculation {
  constructor(
    public readonly lineId: number,
    public readonly summary: ElectromechanicalSummary,
  ) {}

  get totalTowers(): number {
    return this.summary.totalTowers;
  }

  get kpis() {
    return this.summary.kpis;
  }

  get towers() {
    return this.summary.towers;
  }

  get conductors() {
    return this.summary.conductors;
  }

  get groundWires() {
    return this.summary.groundWires;
  }

  get insulators() {
    return this.summary.insulators;
  }

  get guyWires() {
    return this.summary.guyWires;
  }

  get dampers() {
    return this.summary.dampers;
  }

  get grounding() {
    return this.summary.grounding;
  }

  get warningMarkers() {
    return this.summary.warningMarkers;
  }

  get accesses() {
    return this.summary.accesses;
  }

  get vegetationClearing() {
    return this.summary.vegetationClearing;
  }

  get crossings() {
    return this.summary.crossings;
  }

  get consolidatedMaterials() {
    return this.summary.consolidatedMaterials;
  }
}
