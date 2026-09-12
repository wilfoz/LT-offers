import {
  HistoricalOfferFixture,
  ParityCategory,
  ParityMetricComparison,
  ParityMetricStatus,
  ParityModuleSummary,
  ParityReport,
  ParityToleranceConfig,
} from '@lt-offers/domain';
import { FullPipelineRunResult } from './full-offer-pipeline-runner';

export const DEFAULT_PARITY_TOLERANCES: ParityToleranceConfig = {
  discreteMaxDelta: 0,
  physicalMaxRelativePct: 0.001, // 0.001%
  financialMaxRelativePct: 0.01, // 0.01%
};

export class ParityEvaluator {
  private readonly config: ParityToleranceConfig;

  constructor(config: Partial<ParityToleranceConfig> = {}) {
    this.config = {
      ...DEFAULT_PARITY_TOLERANCES,
      ...config,
    };
  }

  public evaluate(fixture: HistoricalOfferFixture, runResult: FullPipelineRunResult): ParityReport {
    const comparisons: ParityMetricComparison[] = [];
    const knownCorrections = fixture.expectedBaseline.knownCorrections || {};

    // 1. Avaliar Discretos
    this.evaluateCategory(
      'Quantitativos Discretos',
      'DISCRETE',
      fixture.expectedBaseline.discrete,
      runResult.calculatedValues.discrete,
      knownCorrections,
      'un',
      this.config.discreteMaxDelta,
      true,
      comparisons
    );

    // 2. Avaliar Físicos Contínuos
    this.evaluateCategory(
      'Quantitativos Físicos',
      'PHYSICAL_CONTINUOUS',
      fixture.expectedBaseline.physical,
      runResult.calculatedValues.physical,
      knownCorrections,
      'qtd',
      this.config.physicalMaxRelativePct,
      false,
      comparisons
    );

    // 3. Avaliar Financeiros Agregados
    this.evaluateCategory(
      'Valores Financeiros',
      'FINANCIAL_AGGREGATE',
      fixture.expectedBaseline.financial,
      runResult.calculatedValues.financial,
      knownCorrections,
      'BRL',
      this.config.financialMaxRelativePct,
      false,
      comparisons
    );

    // Resumo por módulo
    const modulesMap = new Map<string, ParityMetricComparison[]>();
    for (const c of comparisons) {
      if (!modulesMap.has(c.module)) {
        modulesMap.set(c.module, []);
      }
      modulesMap.get(c.module)!.push(c);
    }

    const modules: ParityModuleSummary[] = [];
    let totalConforme = 0;
    let totalCorrecao = 0;
    let totalDesvio = 0;

    for (const [moduleName, items] of modulesMap.entries()) {
      const conformeCount = items.filter((i) => i.status === 'CONFORME').length;
      const correcaoCount = items.filter((i) => i.status === 'CORRECAO_HOMOLOGADA').length;
      const desvioCount = items.filter((i) => i.status === 'DESVIO_DETECTADO').length;

      totalConforme += conformeCount;
      totalCorrecao += correcaoCount;
      totalDesvio += desvioCount;

      modules.push({
        module: moduleName,
        totalMetrics: items.length,
        conformeCount,
        correcaoCount,
        desvioCount,
        status: desvioCount === 0 ? 'PASSED' : 'FAILED',
      });
    }

    return {
      offerCode: fixture.code,
      offerName: fixture.name,
      profileDescription: fixture.description,
      executedAt: new Date().toISOString(),
      executionDurationMs: runResult.executionDurationMs,
      totalMetrics: comparisons.length,
      conformeCount: totalConforme,
      correcaoCount: totalCorrecao,
      desvioCount: totalDesvio,
      isApproved: totalDesvio === 0,
      toleranceConfig: this.config,
      modules,
      comparisons,
    };
  }

  private evaluateCategory(
    moduleName: string,
    category: ParityCategory,
    baseline: Record<string, number>,
    calculated: Record<string, number>,
    knownCorrections: Record<string, { baselineLegacyValue: number; correctedValue: number; note: string }>,
    unit: string,
    maxThreshold: number,
    isAbsoluteThreshold: boolean,
    targetList: ParityMetricComparison[]
  ): void {
    for (const [key, baseVal] of Object.entries(baseline)) {
      const calcVal = calculated[key] ?? 0;
      const deltaAbs = Math.abs(calcVal - baseVal);
      const deltaPct = baseVal === 0 ? 0 : (deltaAbs / Math.abs(baseVal)) * 100;

      let status: ParityMetricStatus = 'CONFORME';
      let technicalNote: string | undefined;

      // Verificar se há correção homologada catalogada
      const matchingCorrectionKey = Object.keys(knownCorrections).find(
        (k) =>
          k.toLowerCase() === key.toLowerCase() ||
          k.toLowerCase().includes(key.toLowerCase()) ||
          key.toLowerCase().includes(k.toLowerCase())
      );
      if (matchingCorrectionKey) {
        const corr = knownCorrections[matchingCorrectionKey];
        status = 'CORRECAO_HOMOLOGADA';
        technicalNote = corr.note;
      } else {
        const isExceeded = isAbsoluteThreshold ? deltaAbs > maxThreshold : deltaPct > maxThreshold;
        if (isExceeded) {
          status = 'DESVIO_DETECTADO';
          technicalNote = `Desvio acima do limite tolerado (${isAbsoluteThreshold ? `delta máx ${maxThreshold}` : `${maxThreshold}%`}).`;
        }
      }

      targetList.push({
        id: `${moduleName}-${key}`,
        module: moduleName,
        metricName: key,
        unit,
        category,
        baselineValue: baseVal,
        calculatedValue: calcVal,
        deltaAbsolute: deltaAbs,
        deltaRelativePct: deltaPct,
        status,
        technicalNote,
      });
    }
  }
}
