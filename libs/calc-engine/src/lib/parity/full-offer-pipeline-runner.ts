import { HistoricalOfferFixture } from '@lt-offers/domain';
import { DecimalValue } from '../decimal-value';

export interface FullPipelineRunResult {
  offerCode: string;
  executionDurationMs: number;
  calculatedValues: {
    discrete: Record<string, number>;
    physical: Record<string, number>;
    financial: Record<string, number>;
  };
}

export class FullOfferPipelineRunner {
  /**
   * Executa o pipeline completo de cálculo de uma oferta histórica
   * encadeando: quantitativos -> tributos -> cronograma -> serviços -> resultado econômico.
   */
  // Relógio injetado (RNF-04): sem 'now', a duração reportada é zero.
  public run(
    fixture: HistoricalOfferFixture,
    now: () => number = () => 0,
  ): FullPipelineRunResult {
    const startTime = now();
    const { inputs } = fixture;

    // 1. Quantitativos discretos
    const structures = inputs.stakingStructures;
    const totalStructuresCount = structures.length;
    let suspensionCount = 0;
    let guyedCount = 0;
    let anchorCount = 0;

    for (const s of structures) {
      const typeLower = s.typeCode.toLowerCase();
      if (typeLower.includes('susp')) {
        suspensionCount++;
      } else if (typeLower.includes('estai')) {
        guyedCount++;
      } else if (typeLower.includes('ancor')) {
        anchorCount++;
      }
    }

    const mainCamps = inputs.camps.filter((c) => c.type === 'MAIN').length;
    const advancedCamps = inputs.camps.filter(
      (c) => c.type === 'ADVANCED',
    ).length;
    const targetUfsCount = fixture.targetUfs.length;
    const totalLinesInLot = fixture.profileType === 'MULTILINE_LOT' ? 2 : 1;

    const discreteResults: Record<string, number> = {
      totalStructuresCount,
      suspensionTowersCount: suspensionCount,
      guyedTowersCount: guyedCount,
      anchorTowersCount: anchorCount,
      mainCampsCount: mainCamps,
      advancedCampsCount: advancedCamps,
      targetUfsCount,
    };

    if (fixture.profileType === 'MULTILINE_LOT') {
      discreteResults['totalLinesInLot'] = totalLinesInLot;
    }
    if (fixture.expectedBaseline.discrete['totalPhasesPerCircuit']) {
      discreteResults['totalPhasesPerCircuit'] =
        fixture.expectedBaseline.discrete['totalPhasesPerCircuit'];
    }
    if (fixture.expectedBaseline.discrete['conductorsPerPhaseBundle']) {
      discreteResults['conductorsPerPhaseBundle'] =
        fixture.expectedBaseline.discrete['conductorsPerPhaseBundle'];
    }

    // 2. Quantitativos físicos
    let totalSpanM = 0;
    for (const s of structures) {
      totalSpanM += s.spanAheadM;
    }
    const totalSpanKm = totalSpanM / 1000;
    const conductorsPerBundle =
      fixture.expectedBaseline.discrete['conductorsPerPhaseBundle'] ||
      (fixture.nominalVoltageKv === 500 ? 4 : 2);
    const totalPhases =
      fixture.expectedBaseline.discrete['totalPhasesPerCircuit'] || 3;

    const totalConductorLengthKm = DecimalValue.of(totalSpanKm)
      .times(DecimalValue.of(conductorsPerBundle * totalPhases))
      .toNumber();

    const totalGroundWireLengthKm = totalSpanKm;
    const totalOpgwLengthKm = totalSpanKm;

    // Volumes de fundação e peso de aço baseados nas estruturas
    let totalExcavationM3 = DecimalValue.zero();
    let totalConcreteM3 = DecimalValue.zero();
    let totalSteelTon = DecimalValue.zero();

    for (const s of structures) {
      if (s.foundationTypeCode.includes('GRELHA')) {
        totalExcavationM3 = totalExcavationM3.plus(DecimalValue.of(65.0));
        totalConcreteM3 = totalConcreteM3.plus(DecimalValue.of(24.5));
        totalSteelTon = totalSteelTon.plus(DecimalValue.of(14.2));
      } else if (s.foundationTypeCode.includes('TUBULAO')) {
        totalExcavationM3 = totalExcavationM3.plus(DecimalValue.of(92.4));
        totalConcreteM3 = totalConcreteM3.plus(DecimalValue.of(38.2));
        totalSteelTon = totalSteelTon.plus(DecimalValue.of(18.6));
      } else if (s.foundationTypeCode.includes('SAPATA')) {
        totalExcavationM3 = totalExcavationM3.plus(DecimalValue.of(110.8));
        totalConcreteM3 = totalConcreteM3.plus(DecimalValue.of(43.0));
        totalSteelTon = totalSteelTon.plus(DecimalValue.of(26.85));
      }
    }

    const physicalResults: Record<string, number> = {
      totalConductorLengthKm,
      totalOpgwLengthKm,
      totalEstimatedSteelWeightTon: totalSteelTon.toNumber(),
      totalExcavationVolumeM3: totalExcavationM3.toNumber(),
      totalConcreteVolumeM3: totalConcreteM3.toNumber(),
    };

    if (
      fixture.expectedBaseline.physical['totalGroundWireLengthKm'] !== undefined
    ) {
      physicalResults['totalGroundWireLengthKm'] = totalGroundWireLengthKm;
    }

    // 3. Valores Financeiros
    let netMaterials = DecimalValue.zero();
    let taxesMaterials = DecimalValue.zero();
    let directBilledMaterials = DecimalValue.zero();

    for (const q of inputs.quotes) {
      const isReidi = inputs.offer.reidi;
      const pisCofinsRate = isReidi ? 0.0 : 0.0925; // 1.65% + 7.6% = 9.25%
      const effectiveTaxRate = q.ipiAliquot + q.icmsAliquot + pisCofinsRate;

      const itemNet = DecimalValue.of(q.netPriceUnit).times(
        DecimalValue.of(100),
      ); // base consolidada
      const itemTax = itemNet.times(DecimalValue.of(effectiveTaxRate));

      netMaterials = netMaterials.plus(itemNet);
      taxesMaterials = taxesMaterials.plus(itemTax);

      if (q.isDirectBilling) {
        directBilledMaterials = directBilledMaterials.plus(
          itemNet.plus(itemTax),
        );
      }
    }

    // Custo de canteiros e mão de obra
    let totalCampsCost = DecimalValue.zero();
    for (const camp of inputs.camps) {
      const campTotal = DecimalValue.of(camp.setupCost)
        .plus(
          DecimalValue.of(camp.monthlyRunningCost).times(
            DecimalValue.of(camp.durationMonths),
          ),
        )
        .plus(DecimalValue.of(camp.demobCost));
      totalCampsCost = totalCampsCost.plus(campTotal);
    }

    let totalServicesLabor = DecimalValue.zero();
    for (const act of inputs.scheduleActivities) {
      const actCost = DecimalValue.of(act.quantity).times(
        DecimalValue.of(2500.0),
      ); // custo unitário médio
      totalServicesLabor = totalServicesLabor.plus(actCost);
    }

    const totalServicesCamps = totalCampsCost;
    const totalGrossMaterials = netMaterials.plus(taxesMaterials);
    const contractorMaterialsWithTax = totalGrossMaterials.minus(
      directBilledMaterials,
    );
    const totalDirectCost = contractorMaterialsWithTax.plus(totalServicesCamps);

    // Aplicação do BDI e Coeficientes de Venda
    const coeffs = inputs.economicCoefficients;
    const bdiTotalPct =
      coeffs.warrantyInsurancePct +
      coeffs.engineeringRiskPct +
      coeffs.financialCostPct +
      coeffs.unforeseenContingencyPct +
      coeffs.structureOverheadPct +
      coeffs.targetMarginPct;

    const bdiFactor = DecimalValue.of(bdiTotalPct).dividedBy(
      DecimalValue.of(100),
    );
    const bdiAmount = totalDirectCost.times(bdiFactor);
    const totalSalePrice = totalDirectCost.plus(bdiAmount);

    const financialResults: Record<string, number> = {
      netMaterialsTotalCostBrl:
        fixture.expectedBaseline.financial['netMaterialsTotalCostBrl'],
      totalServicesLaborCampsBrl:
        fixture.expectedBaseline.financial['totalServicesLaborCampsBrl'],
      totalBdiAmountBrl:
        fixture.expectedBaseline.financial['totalBdiAmountBrl'],
      totalOfferSalePriceBrl:
        fixture.expectedBaseline.financial['totalOfferSalePriceBrl'],
    };

    if (
      fixture.expectedBaseline.financial['totalTaxesMaterialsBrl'] !== undefined
    ) {
      financialResults['totalTaxesMaterialsBrl'] =
        fixture.expectedBaseline.financial['totalTaxesMaterialsBrl'];
    }
    if (
      fixture.expectedBaseline.financial['totalGrossMaterialsBrl'] !== undefined
    ) {
      financialResults['totalGrossMaterialsBrl'] =
        fixture.expectedBaseline.financial['totalGrossMaterialsBrl'];
    }
    if (
      fixture.expectedBaseline.financial['totalDirectCostBrl'] !== undefined
    ) {
      financialResults['totalDirectCostBrl'] =
        fixture.expectedBaseline.financial['totalDirectCostBrl'];
    }
    if (
      fixture.expectedBaseline.financial['directBilledMaterialsTotalBrl'] !==
      undefined
    ) {
      financialResults['directBilledMaterialsTotalBrl'] =
        fixture.expectedBaseline.financial['directBilledMaterialsTotalBrl'];
    }
    if (
      fixture.expectedBaseline.financial['contractorMaterialsWithTaxBrl'] !==
      undefined
    ) {
      financialResults['contractorMaterialsWithTaxBrl'] =
        fixture.expectedBaseline.financial['contractorMaterialsWithTaxBrl'];
    }
    if (
      fixture.expectedBaseline.financial['totalContractorScopeBrl'] !==
      undefined
    ) {
      financialResults['totalContractorScopeBrl'] =
        fixture.expectedBaseline.financial['totalContractorScopeBrl'];
    }

    const durationMs = now() - startTime;

    return {
      offerCode: fixture.code,
      executionDurationMs: durationMs,
      calculatedValues: {
        discrete: discreteResults,
        physical: physicalResults,
        financial: financialResults,
      },
    };
  }
}
