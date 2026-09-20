import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ElectromechanicalSummary,
  TowerTraceabilityDetail,
} from '@lt-offers/domain';
import {
  TowerQuantityCalculator,
  TowerInputData,
  CableQuantityCalculator,
  ConductorInputData,
  GroundWireInputData,
  HardwareQuantityCalculator,
  AccessQuantityCalculator,
  ElectromechanicalSummaryCalculator,
} from '@lt-offers/calc-engine';
import { PrismaService } from '../app/prisma.service';

@Injectable()
export class ElectromechanicalService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateLineElectromechanical(
    lineId: number,
  ): Promise<ElectromechanicalSummary> {
    const line = await this.prisma.transmissionLine.findUnique({
      where: { id: lineId },
      include: {
        offerRevision: {
          include: {
            offer: true,
          },
        },
      },
    });

    if (!line) {
      throw new NotFoundException(
        `Linha de transmissão ID ${lineId} não encontrada.`,
      );
    }

    const lengthKm = Number(line.refinedLengthKm || line.reportLengthKm || 100);
    const circuits = 1; // Padrão circuito simples se não especificado
    const subconductorsPerPhase = 4; // Feixe quadruplo padrão para 500 kV

    // 1. Torres
    const towersCount = Math.max(1, Math.round(lengthKm * 2.5)); // ~400m de vão médio

    // Criar distribuição realista de torres para a extensão
    const suspensionCount = Math.round(towersCount * 0.85);
    const tensionCount = towersCount - suspensionCount;

    const fullTowersList: TowerInputData[] = [];
    for (let i = 1; i <= suspensionCount; i++) {
      fullTowersList.push({
        towerNumber: `T${String(i).padStart(3, '0')}`,
        stationMeters: (i - 1) * 400,
        towerTypeId: 1,
        towerTypeCode: 'SUSP-LEVE',
        towerTypeName: 'Torre de Suspensão Leve',
        seriesName: 'Série 500kV Poções',
        bodyHeightM: 35,
        legExtensionM: (i % 5) * 0.5,
        baseWeightKg: 14500,
        legWeightKgPerM: 150,
      });
    }

    for (let j = 1; j <= tensionCount; j++) {
      const idx = suspensionCount + j;
      fullTowersList.push({
        towerNumber: `T${String(idx).padStart(3, '0')}`,
        stationMeters: (idx - 1) * 400,
        towerTypeId: 2,
        towerTypeCode: 'ANC-PESADA',
        towerTypeName: 'Torre de Ancoragem Pesada',
        seriesName: 'Série 500kV Poções',
        bodyHeightM: 38,
        legExtensionM: (j % 4) * 1.0,
        baseWeightKg: 28500,
        legWeightKgPerM: 200,
      });
    }

    const towerResult = TowerQuantityCalculator.calculate(fullTowersList, {
      extraPercent: 0.5,
    });

    // 2. Cabos Condutores
    const conductorsInput: ConductorInputData[] = [
      {
        cableCode: 'RAIL-954',
        cableName: 'ACSR 954 kcmil Rail',
        nominalSectionMm2: 483.4,
        weightKgPerKm: 1850,
        circuits,
        subconductorsPerPhase,
        routeLengthKm: lengthKm,
        sagFactorPercent: 2.5,
        wasteFactorPercent: 3.0,
        sparePercent: 1.0,
      },
    ];
    const conductors =
      CableQuantityCalculator.calculateConductors(conductorsInput);

    // 3. Cabos de Guarda (Aço e OPGW)
    const groundWiresInput: GroundWireInputData[] = [
      {
        cableCode: 'OPGW-48F',
        cableName: 'OPGW 48 Fibras',
        type: 'OPGW',
        weightKgPerKm: 620,
        routeLengthKm: lengthKm,
        sagFactorPercent: 1.5,
        splicingTowersCount: Math.round(lengthKm / 4), // Uma emenda a cada 4 km
        downleadPerTowerM: 40,
        wasteFactorPercent: 3.0,
        sparePercent: 1.0,
        fiberCount: 48,
      },
      {
        cableCode: 'EHS-3/8',
        cableName: 'Cabo de Aço Galvanizado EHS 3/8"',
        type: 'STEEL',
        weightKgPerKm: 410,
        routeLengthKm: lengthKm,
        sagFactorPercent: 1.5,
        wasteFactorPercent: 3.0,
        sparePercent: 1.0,
      },
    ];
    const groundWires =
      CableQuantityCalculator.calculateGroundWires(groundWiresInput);

    // 4. Ferragens e Isoladores
    const insulators = HardwareQuantityCalculator.calculateInsulators([
      {
        typeCode: 'ISO-VIDRO-160KN',
        typeName: 'Isolador de Vidro Temperado 160 kN (Suspensão)',
        category: 'SUSPENSION',
        stringsCount: suspensionCount * 3 * 2, // 3 fases, cadeia dupla
        unitsPerString: 28,
        breakageExtraPercent: 2.0,
        sparePercent: 2.0,
      },
      {
        typeCode: 'ISO-VIDRO-210KN',
        typeName: 'Isolador de Vidro Temperado 210 kN (Ancoragem)',
        category: 'TENSION',
        stringsCount: tensionCount * 3 * 4, // 3 fases, cadeia quádrupla
        unitsPerString: 30,
        breakageExtraPercent: 2.0,
        sparePercent: 2.0,
      },
    ]);

    const guyWires = HardwareQuantityCalculator.calculateGuyWires([
      {
        cableCode: 'TIR-3/8',
        cableName: 'Cabo de Aço Galvanizado para Estais 3/8"',
        weightKgPerM: 0.45,
        guyedTowersCount: Math.round(towersCount * 0.3), // 30% estaiadas
        guysPerTower: 4,
        averageGuyLengthM: 45,
        extraPercent: 3.0,
      },
    ]);

    const dampers = HardwareQuantityCalculator.calculateDampers([
      {
        cableType: 'CONDUCTOR',
        cableCode: 'RAIL-954',
        dampersPerSpan: 4, // 4 subcondutores
        totalSpans: towersCount - 1,
        extraPercent: 2.0,
      },
      {
        cableType: 'GROUND_WIRE',
        cableCode: 'OPGW-48F',
        dampersPerSpan: 2,
        totalSpans: towersCount - 1,
        extraPercent: 2.0,
      },
    ]);

    const grounding = HardwareQuantityCalculator.calculateGrounding([
      {
        itemCode: 'HASTE-COBRE-5/8',
        itemName: 'Haste de Aterramento Aço Cobreado 5/8" x 3,00m',
        unit: 'un',
        quantityPerTower: 4,
        towersCount,
        extraPercent: 5.0,
      },
      {
        itemCode: 'CABO-COBRE-50MM',
        itemName: 'Cabo de Cobre Nu 50 mm² para Contrapeso',
        unit: 'm',
        quantityPerTower: 60,
        towersCount,
        extraPercent: 5.0,
      },
    ]);

    const warningMarkers = HardwareQuantityCalculator.calculateWarningMarkers([
      {
        itemCode: 'ESFERA-SINAL-LARANJA',
        itemName: 'Esfera de Sinalização Aeroespacial Laranja 600mm',
        spansWithMarkers: Math.round(lengthKm * 0.1), // 10% dos vãos com sinalização
        markersPerSpan: 6,
        spareUnits: 4,
      },
    ]);

    // 5. Acessos, Limpeza de Faixa e Travessias
    const accesses = AccessQuantityCalculator.calculateAccesses([
      {
        accessType: 'OPENING_NEW',
        description: 'Abertura de Acessos Novos em Terreno Ondulado',
        lengthKm: Number((lengthKm * 0.35).toFixed(2)),
      },
      {
        accessType: 'RECOVERY_EXISTING',
        description: 'Recuperação e Manutenção de Estradas Existentes',
        lengthKm: Number((lengthKm * 0.45).toFixed(2)),
      },
    ]);

    const vegetationClearing =
      AccessQuantityCalculator.calculateVegetationClearing([
        {
          density: 'DENSE',
          description: 'Supressão Vegetal Densa / Floresta Estacional',
          rightOfWayWidthM: 50,
          lengthKm: Number((lengthKm * 0.25).toFixed(2)),
        },
        {
          density: 'MEDIUM',
          description: 'Limpeza de Vegetação Média / Cerrado',
          rightOfWayWidthM: 50,
          lengthKm: Number((lengthKm * 0.45).toFixed(2)),
        },
        {
          density: 'LIGHT',
          description: 'Roçado e Limpeza Raso / Pastagem',
          rightOfWayWidthM: 50,
          lengthKm: Number((lengthKm * 0.3).toFixed(2)),
        },
      ]);

    const crossings = AccessQuantityCalculator.calculateCrossings([
      {
        type: 'HIGHWAY',
        description: 'Travessia de Rodovia Federal / Estadual',
        count: Math.max(2, Math.round(lengthKm / 30)),
      },
      {
        type: 'RAILWAY',
        description: 'Travessia de Ferrovia',
        count: Math.max(1, Math.round(lengthKm / 60)),
      },
      {
        type: 'RIVER',
        description: 'Travessia de Rio Navegável (> 100m)',
        count: Math.max(1, Math.round(lengthKm / 50)),
      },
      {
        type: 'EXISTING_LINE',
        description: 'Cruzamento com Linha de Transmissão Existente',
        count: Math.max(2, Math.round(lengthKm / 25)),
      },
    ]);

    // 6. Resumo Consolidado
    return ElectromechanicalSummaryCalculator.calculateSummary({
      lineId: String(line.id),
      lineName: line.name,
      lineLengthKm: lengthKm,
      totalTowers: towersCount,
      towers: towerResult.items,
      conductors,
      groundWires,
      insulators,
      guyWires,
      dampers,
      grounding,
      warningMarkers,
      accesses,
      vegetationClearing,
      crossings,
    });
  }

  async getLineElectromechanicalTraceability(
    lineId: number,
  ): Promise<TowerTraceabilityDetail[]> {
    const summary = await this.calculateLineElectromechanical(lineId);
    // Gerar rastreabilidade torre a torre
    const towersCount = summary.totalTowers;
    const traceability: TowerTraceabilityDetail[] = [];

    for (let i = 1; i <= towersCount; i++) {
      const isTension = i % 7 === 0;
      const height = isTension ? 38 : 35;
      const baseWeight = isTension ? 28500 : 14500;
      const legExt = (i % 4) * 0.5;
      const legWeight = legExt * (isTension ? 200 : 150);

      traceability.push({
        towerNumber: `T${String(i).padStart(3, '0')}`,
        stationMeters: String((i - 1) * 400),
        towerTypeCode: isTension ? 'ANC-PESADA' : 'SUSP-LEVE',
        heightM: height,
        legExtensionM: legExt,
        nominalWeightKg: baseWeight,
        legExtensionWeightKg: legWeight,
        totalStructureWeightKg: baseWeight + legWeight,
      });
    }

    return traceability;
  }
}
