import { TowerQuantityCalculator } from './tower-calculator';
import { CableQuantityCalculator } from './cable-calculator';
import { HardwareQuantityCalculator } from './hardware-calculator';
import { AccessQuantityCalculator } from './access-calculator';
import { ElectromechanicalSummaryCalculator } from './summary-calculator';

describe('Electromechanical Calculators (M05, RF-23, RF-25, RF-26, RF-27, RN-10, RN-11)', () => {
  describe('TowerQuantityCalculator (RF-23, RN-10)', () => {
    it('deve calcular a tonelagem de torres treliçadas com perdas de 0,5% e extensões de perna', () => {
      const towers = [
        {
          towerNumber: 'T01',
          stationMeters: '0',
          towerTypeId: 1,
          towerTypeCode: 'SL-SUSP',
          towerTypeName: 'Suspensão Leve',
          bodyHeightM: 35,
          legExtensionM: 2, // + 2m * 150 kg/m = 300 kg
          baseWeightKg: 14500,
        },
        {
          towerNumber: 'T02',
          stationMeters: '450',
          towerTypeId: 1,
          towerTypeCode: 'SL-SUSP',
          towerTypeName: 'Suspensão Leve',
          bodyHeightM: 35,
          legExtensionM: 0,
          baseWeightKg: 14500,
        },
      ];

      const res = TowerQuantityCalculator.calculate(towers, {
        extraPercent: 0.5,
      });

      expect(res.items).toHaveLength(1);
      // Theoretical: (14500 + 300) + 14500 = 29300 kg
      expect(res.totalTheoreticalWeightKg.toNumber()).toBe(29300);
      // Extra: 29300 * 0.005 = 146.5 kg
      expect(res.totalExtraWeightKg.toNumber()).toBe(146.5);
      // Total: 29300 + 146.5 = 29446.5 kg = 29.447 tons
      expect(res.totalWeightKg.toNumber()).toBe(29446.5);
      expect(res.totalWeightTons.toNumber()).toBe(29.447);
      expect(res.traceability).toHaveLength(2);
      expect(res.traceability[0].totalStructureWeightKg).toBe(14800);
    });
  });

  describe('CableQuantityCalculator (RF-23, RN-10, RN-11)', () => {
    it('deve calcular cabos condutores considerando circuitos, feixe, flecha de 2,5% e perda de 3,0%', () => {
      const conductors = [
        {
          cableCode: 'RAIL-954',
          cableName: 'ACSR 954 kcmil Rail',
          nominalSectionMm2: 483.4,
          weightKgPerKm: 1850,
          circuits: 1,
          subconductorsPerPhase: 4, // Feixe quadruplo
          routeLengthKm: 100,
          sagFactorPercent: 2.5, // RN-11
          wasteFactorPercent: 3.0, // RN-10
        },
      ];

      const res = CableQuantityCalculator.calculateConductors(conductors);
      expect(res).toHaveLength(1);

      const c = res[0];
      // Theoretical Km: 100 * 3 * 4 * 1.025 = 1230 km
      expect(c.theoreticalLengthKm).toBe(1230);
      // Waste Km: 1230 * 0.03 = 36.9 km
      expect(c.wasteLengthKm).toBe(36.9);
      // Total Km: 1230 + 36.9 = 1266.9 km
      expect(c.totalLengthKm).toBe(1266.9);
      // Total Tons: 1266.9 * 1850 / 1000 = 2343.765 tons
      expect(c.totalWeightTons).toBe(2343.765);
    });

    it('deve calcular cabo de guarda OPGW com descidas verticais de torre', () => {
      const groundWires = [
        {
          cableCode: 'OPGW-24F',
          cableName: 'OPGW 24 Fibras',
          type: 'OPGW' as const,
          weightKgPerKm: 600,
          routeLengthKm: 100,
          sagFactorPercent: 1.5,
          splicingTowersCount: 25,
          downleadPerTowerM: 40, // 25 * 0.04 = 1.0 km
          wasteFactorPercent: 3.0,
        },
      ];

      const res = CableQuantityCalculator.calculateGroundWires(groundWires);
      expect(res).toHaveLength(1);

      const gw = res[0];
      // Theoretical: 100 * 1.015 + 1.0 = 102.5 km
      expect(gw.theoreticalLengthKm).toBe(102.5);
      // Waste: 102.5 * 0.03 = 3.075 km
      expect(gw.wasteLengthKm).toBe(3.075);
      // Total: 105.575 km
      expect(gw.totalLengthKm).toBe(105.575);
      // Total Tons: 105.575 * 600 / 1000 = 63.345 tons
      expect(gw.totalWeightTons).toBe(63.345);
    });
  });

  describe('HardwareQuantityCalculator & AccessQuantityCalculator (RF-23, RF-25)', () => {
    it('deve calcular isoladores, tirantes e amortecedores', () => {
      const insulators = HardwareQuantityCalculator.calculateInsulators([
        {
          typeCode: 'ISO-VIDRO-160KN',
          typeName: 'Isolador de Vidro 160 kN',
          category: 'SUSPENSION',
          stringsCount: 100,
          unitsPerString: 28,
          breakageExtraPercent: 2.0,
        },
      ]);

      expect(insulators[0].theoreticalUnits).toBe(2800);
      expect(insulators[0].extraUnits).toBe(56);
      expect(insulators[0].totalUnits).toBe(2856);

      const guyWires = HardwareQuantityCalculator.calculateGuyWires([
        {
          cableCode: 'TIR-3/8',
          cableName: 'Cabo de Aço Galvanizado 3/8"',
          weightKgPerM: 0.45,
          guyedTowersCount: 10,
          guysPerTower: 4,
          averageGuyLengthM: 45,
          extraPercent: 3.0,
        },
      ]);

      // 10 * 4 * 45 = 1800m -> Extra 3% = 54m -> Total 1854m -> 1854 * 0.45 = 834.3 kg
      expect(guyWires[0].theoreticalLengthM).toBe(1800);
      expect(guyWires[0].totalLengthM).toBe(1854);
      expect(guyWires[0].totalWeightKg).toBe(834.3);
    });

    it('deve calcular áreas de limpeza de faixa de servidão e acessos', () => {
      const accesses = AccessQuantityCalculator.calculateAccesses([
        {
          accessType: 'OPENING_NEW',
          description: 'Abertura de Picada em Terreno Ondulado',
          lengthKm: 25.5,
        },
      ]);
      expect(accesses[0].lengthKm).toBe(25.5);

      const clearing = AccessQuantityCalculator.calculateVegetationClearing([
        {
          density: 'DENSE',
          description: 'Supressão de Mata Atlântica / Densa',
          rightOfWayWidthM: 50,
          lengthKm: 30,
        },
      ]);

      // (30 km * 50 m) / 10 = 150 hectares
      expect(clearing[0].areaHectares).toBe(150);
    });
  });

  describe('ElectromechanicalSummaryCalculator (RF-26, RF-27)', () => {
    it('deve consolidar o resumo completo e produzir a lista de materiais para M06', () => {
      const summary = ElectromechanicalSummaryCalculator.calculateSummary({
        lineId: '1',
        lineName: 'LT 500 kV Teste',
        lineLengthKm: 100,
        totalTowers: 250,
        towers: [
          {
            towerTypeId: 1,
            towerTypeCode: 'SL-SUSP',
            towerTypeName: 'Suspensão Leve',
            heightBodyM: 35,
            baseWeightKg: 14500,
            count: 250,
            theoreticalWeightKg: 3625000,
            extraPercent: 0.5,
            extraWeightKg: 18125,
            sparePercent: 0,
            spareWeightKg: 0,
            totalWeightKg: 3643125,
            totalWeightTons: 3643.125,
          },
        ],
        conductors: [
          {
            cableCode: 'RAIL-954',
            cableName: 'ACSR 954 Rail',
            nominalSectionMm2: 483.4,
            weightKgPerKm: 1850,
            circuits: 1,
            phasesPerCircuit: 3,
            subconductorsPerPhase: 4,
            routeLengthKm: 100,
            sagFactorPercent: 2.5,
            theoreticalLengthKm: 1230,
            wasteFactorPercent: 3.0,
            wasteLengthKm: 36.9,
            sparePercent: 0,
            spareLengthKm: 0,
            totalLengthKm: 1266.9,
            totalWeightTons: 2343.765,
          },
        ],
        groundWires: [],
        insulators: [],
        guyWires: [],
        dampers: [],
        grounding: [],
        warningMarkers: [],
        accesses: [],
        vegetationClearing: [],
        crossings: [],
      });

      expect(summary.kpis.totalTowerSteelTons).toBe(3643.125);
      expect(summary.kpis.totalConductorKm).toBe(1266.9);
      expect(summary.kpis.totalConductorTons).toBe(2343.765);
      expect(summary.consolidatedMaterials).toHaveLength(2);
      expect(summary.consolidatedMaterials[0].itemCode).toBe('MAT-TOR-SL-SUSP');
      expect(summary.consolidatedMaterials[0].totalQuantity).toBe(3643125);
    });
  });
});
