import {
  ELECTROMECHANICAL_FAMILIES,
  ELECTROMECHANICAL_FAMILY_LABELS,
  ElectromechanicalFamily,
  ElectromechanicalSummary,
} from './summary';

describe('Electromechanical Domain Contracts (M05, RF-23, RF-25, RF-26)', () => {
  it('deve possuir todas as famílias de suprimentos eletromecânicos mapeadas', () => {
    expect(ELECTROMECHANICAL_FAMILIES).toHaveLength(8);
    expect(ELECTROMECHANICAL_FAMILIES).toContain('TOWERS');
    expect(ELECTROMECHANICAL_FAMILIES).toContain('CONDUCTORS');
    expect(ELECTROMECHANICAL_FAMILIES).toContain('GROUND_WIRES');
    expect(ELECTROMECHANICAL_FAMILIES).toContain('INSULATORS');
    expect(ELECTROMECHANICAL_FAMILIES).toContain('GUY_WIRES');
    expect(ELECTROMECHANICAL_FAMILIES).toContain('HARDWARE_ACCESSORIES');
    expect(ELECTROMECHANICAL_FAMILIES).toContain('GROUNDING');
    expect(ELECTROMECHANICAL_FAMILIES).toContain('ACCESSES_CIVIL');

    ELECTROMECHANICAL_FAMILIES.forEach((family: ElectromechanicalFamily) => {
      expect(ELECTROMECHANICAL_FAMILY_LABELS[family]).toBeTruthy();
    });
  });

  it('deve instanciar uma estrutura válida de ElectromechanicalSummary', () => {
    const summary: ElectromechanicalSummary = {
      lineId: '1',
      lineName: 'LT 500 kV Poções III - Padre Paraíso C1',
      lineLengthKm: 120.5,
      totalTowers: 280,
      kpis: {
        totalTowerSteelTons: 3850.5,
        totalConductorKm: 1482.15,
        totalConductorTons: 2741.97,
        totalGroundWireKm: 253.05,
        totalGroundWireTons: 151.83,
        totalInsulatorUnits: 24500,
        totalAccessKm: 45.0,
        totalClearingHectares: 602.5,
      },
      towers: [],
      conductors: [],
      groundWires: [],
      insulators: [],
      guyWires: [],
      dampers: [],
      grounding: [],
      warningMarkers: [],
      accesses: [],
      vegetationClearing: [],
      crossings: [],
      consolidatedMaterials: [],
    };

    expect(summary.lineId).toBe('1');
    expect(summary.kpis.totalTowerSteelTons).toBe(3850.5);
    expect(summary.totalTowers).toBe(280);
  });
});
