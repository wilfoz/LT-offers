import {
  calculateLineFoundations,
  calculateWaste,
} from './foundation-calculator';
import {
  FoundationCalculationInput,
  FoundationVolumeQuantities,
} from '@lt-offers/domain';
import { DecimalValue } from '../decimal-value';

describe('Foundation Calculator Engine (M05, RN-12, RN-13, RF-20..RF-27)', () => {
  const sampleMatrixQuantities: FoundationVolumeQuantities = {
    excavationHardFootingM3: '10.000',
    excavationNormalFootingM3: '20.000',
    excavationWaterFootingM3: '5.000',
    excavationHardPrecastM3: null,
    excavationNormalPrecastM3: null,
    excavationWaterPrecastM3: null,
    excavationHardPileCapM3: null,
    excavationNormalPileCapM3: null,
    excavationWaterPileCapM3: null,
    excavationPierM3: '30.000',
    anchorBoltDrillingM: '0.000',
    steelPiersKg: '500.00',
    steelFootingsKg: '1200.00',
    steelPileCapsKg: null,
    steelPrecastKg: null,
    steelRockKg: null,
    steelAnchorBoltsKg: '80.00',
    concretePiersM3: '15.000',
    concreteFootingsM3: '25.000',
    concretePileCapsM3: null,
    concretePrecastM3: null,
    concreteRockM3: null,
    regenerationM3: '2.000',
    groutM3: '0.500',
    backfillSoilM3: '18.000',
    backfillSoilCementM3: null,
    formworkM2: '45.000',
    helicalPileM: null,
    steelPileM: null,
    triconeM: null,
    rootPileM: null,
    continuousAugerPileM: null,
    micropileM: null,
    concretePileM: null,
  };

  it('deve aplicar fatores de sobre-escavação e perdas da RN-12 corretamente', () => {
    // Duro 10%: 10.000 + 10% = 11.000
    const hardWaste = calculateWaste(DecimalValue.of('10.000'), 10);
    expect(hardWaste.waste.toText()).toBe('1');
    expect(hardWaste.total.toText()).toBe('11');

    // Normal 5%: 20.000 + 5% = 21.000
    const normalWaste = calculateWaste(DecimalValue.of('20.000'), 5);
    expect(normalWaste.waste.toText()).toBe('1');
    expect(normalWaste.total.toText()).toBe('21');

    // Água 20%: 5.000 + 20% = 6.000
    const waterWaste = calculateWaste(DecimalValue.of('5.000'), 20);
    expect(waterWaste.waste.toText()).toBe('1');
    expect(waterWaste.total.toText()).toBe('6');

    // Aço sapata 10%: 1200.00 + 10% = 1320.00
    const steelWaste = calculateWaste(DecimalValue.of('1200.00'), 10);
    expect(steelWaste.waste.toText()).toBe('120');
    expect(steelWaste.total.toText()).toBe('1320');

    // Aço tubulão 3%: 500.00 + 3% = 515.00
    const pierSteelWaste = calculateWaste(DecimalValue.of('500.00'), 3);
    expect(pierSteelWaste.waste.toText()).toBe('15');
    expect(pierSteelWaste.total.toText()).toBe('515');
  });

  it('deve calcular quantitativos detalhados torre a torre com estaqueamento real', () => {
    const input: FoundationCalculationInput = {
      transmissionLineId: 1,
      towers: [
        {
          id: 101,
          towerNumber: 'T01',
          stationMeters: '0.00',
          towerTypeId: 1,
          towerCode: 'SL-20',
          soilTypeId: 2,
          soilCode: 'II',
          foundationTypeId: 3,
          foundationCode: 'SAP',
        },
        {
          id: 102,
          towerNumber: 'T02',
          stationMeters: '350.50',
          towerTypeId: 1,
          towerCode: 'SL-20',
          soilTypeId: 2,
          soilCode: 'II',
          foundationTypeId: 3,
          foundationCode: 'SAP',
        },
      ],
      volumeMatrices: [
        {
          towerTypeId: 1,
          soilTypeId: 2,
          foundationTypeId: 3,
          quantities: sampleMatrixQuantities,
        },
      ],
    };

    const result = calculateLineFoundations(input);

    expect(result.summary.totalTowers).toBe(2);
    expect(result.summary.calculatedTowers).toBe(2);
    expect(result.summary.pendingTowers).toBe(0);
    expect(result.summary.missingCombinations).toHaveLength(0);

    // Verificação de materiais acumulados para 2 torres
    // Escavação dura: 2 torres * 10 m³ = 20 m³ teóricos + 10% (2 m³) = 22.000 m³
    const hardExc = result.summary.materials.find(
      (m) => m.field === 'excavationHardFootingM3',
    );
    expect(hardExc).toBeDefined();
    expect(hardExc?.theoreticalQuantity).toBe('20.000');
    expect(hardExc?.wasteQuantity).toBe('2.000');
    expect(hardExc?.totalQuantity).toBe('22.000');

    // Concreto sapata: 2 torres * 25 m³ = 50 m³ teóricos + 5% (2.5 m³) = 52.500 m³
    const footingConc = result.summary.materials.find(
      (m) => m.field === 'concreteFootingsM3',
    );
    expect(footingConc?.theoreticalQuantity).toBe('50.000');
    expect(footingConc?.wasteQuantity).toBe('2.500');
    expect(footingConc?.totalQuantity).toBe('52.500');

    // Aço sapata: 2 torres * 1200 kg = 2400 kg teóricos + 10% (240 kg) = 2640.00 kg
    const footingSteel = result.summary.materials.find(
      (m) => m.field === 'steelFootingsKg',
    );
    expect(footingSteel?.theoreticalQuantity).toBe('2400.00');
    expect(footingSteel?.wasteQuantity).toBe('240.00');
    expect(footingSteel?.totalQuantity).toBe('2640.00');

    // Rastreabilidade (RF-27)
    expect(result.traceability.concreteFootingsM3.towersCount).toBe(2);
    expect(result.traceability.concreteFootingsM3.towerDetails).toHaveLength(2);
    expect(result.traceability.concreteFootingsM3.towerDetails[0].towerNumber).toBe('T01');
    expect(result.traceability.concreteFootingsM3.towerDetails[1].towerNumber).toBe('T02');
  });

  it('deve registrar pendências explicitamente para torres sem combinação no catálogo (RNF-09, RF-20)', () => {
    const input: FoundationCalculationInput = {
      transmissionLineId: 1,
      towers: [
        {
          id: 1,
          towerNumber: 'T01',
          stationMeters: '0.00',
          towerTypeId: 1,
          towerCode: 'SL-20',
          soilTypeId: 2,
          soilCode: 'II',
          foundationTypeId: 3,
          foundationCode: 'SAP',
        },
        {
          id: 2,
          towerNumber: 'T02',
          stationMeters: '400.00',
          towerTypeId: 99, // Inexistente
          towerCode: 'TX-99',
          soilTypeId: 5,
          soilCode: 'V',
          foundationTypeId: 8,
          foundationCode: 'ESTACA',
        },
      ],
      volumeMatrices: [
        {
          towerTypeId: 1,
          soilTypeId: 2,
          foundationTypeId: 3,
          quantities: sampleMatrixQuantities,
        },
      ],
    };

    const result = calculateLineFoundations(input);

    expect(result.summary.totalTowers).toBe(2);
    expect(result.summary.calculatedTowers).toBe(1);
    expect(result.summary.pendingTowers).toBe(1);

    expect(result.summary.missingCombinations).toHaveLength(1);
    expect(result.summary.missingCombinations[0].affectedTowerNumbers).toEqual(['T02']);
    expect(result.towerCalculations[1].status).toBe('MISSING_COMBINATION');
  });

  it('deve calcular com distribuição preliminar paramétrica (RF-21)', () => {
    const input: FoundationCalculationInput = {
      transmissionLineId: 2,
      preliminaryDistribution: {
        totalTowers: 100,
        soilPercentages: [
          { id: 2, percentage: '60.00' }, // 60% solo 2
          { id: 3, percentage: '40.00' }, // 40% solo 3
        ],
        foundationPercentages: [
          { id: 1, percentage: '100.00' }, // 100% sapata
        ],
        defaultTowerTypeId: 1,
      },
      volumeMatrices: [
        {
          towerTypeId: 1,
          soilTypeId: 2,
          foundationTypeId: 1,
          quantities: {
            ...sampleMatrixQuantities,
            concreteFootingsM3: '20.000',
          },
        },
        {
          towerTypeId: 1,
          soilTypeId: 3,
          foundationTypeId: 1,
          quantities: {
            ...sampleMatrixQuantities,
            concreteFootingsM3: '30.000',
          },
        },
      ],
    };

    const result = calculateLineFoundations(input);

    expect(result.summary.calculationMode).toBe('PRELIMINARY_PARAMETRIC');
    expect(result.summary.totalTowers).toBe(100);

    // Solo 2: 60 torres * 20 m³ = 1200 m³
    // Solo 3: 40 torres * 30 m³ = 1200 m³
    // Total teórico: 2400 m³ + 5% (120 m³) = 2520.000 m³
    const conc = result.summary.materials.find((m) => m.field === 'concreteFootingsM3');
    expect(conc?.theoreticalQuantity).toBe('2400.000');
    expect(conc?.wasteQuantity).toBe('120.000');
    expect(conc?.totalQuantity).toBe('2520.000');
  });

  it('garante determinismo estrito em execuções repetidas (RNF-04)', () => {
    const input: FoundationCalculationInput = {
      transmissionLineId: 1,
      towers: [
        {
          id: 1,
          towerNumber: 'T01',
          stationMeters: '0.00',
          towerTypeId: 1,
          soilTypeId: 2,
          foundationTypeId: 3,
        },
      ],
      volumeMatrices: [
        {
          towerTypeId: 1,
          soilTypeId: 2,
          foundationTypeId: 3,
          quantities: sampleMatrixQuantities,
        },
      ],
    };

    const run1 = calculateLineFoundations(input);
    const run2 = calculateLineFoundations(input);

    expect(JSON.stringify(run1)).toBe(JSON.stringify(run2));
  });
});
