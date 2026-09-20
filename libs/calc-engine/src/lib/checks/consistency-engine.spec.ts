import {
  ConsistencyEngine,
  ConsistencyEngineInput,
} from './consistency-engine';

describe('ConsistencyEngine', () => {
  it('deve aprovar (HEALTHY) uma oferta com dados 100% consistentes e sem pendências', () => {
    const input: ConsistencyEngineInput = {
      offerId: 'off-1',
      stakingLines: [
        {
          lineId: 'line-1',
          lineName: 'LT 500kV Trecho 1',
          declaredTowersCount: 150,
          actualStakingCount: 150,
          invalidSoilFoundationPairsCount: 0,
        },
      ],
      materials: [
        {
          materialId: 'mat-1',
          materialName: 'Cabo CAA Grosbeak',
          quantity: '120000',
          hasSelectedQuote: true,
          originState: 'SP',
          isTaxResolved: true,
        },
      ],
      scheduleActivities: [
        {
          lineId: 'line-1',
          activityId: 'act-1',
          activityName: 'Montagem de Estruturas',
          requiredDailyProduction: '1.5',
          maxTeamDailyProduction: '2.0',
          isMilestoneExceeded: false,
        },
      ],
      histogramDeficits: [],
      services: [
        {
          lineId: 'line-1',
          totalEngineeredQuantity: '150',
          totalBudgetedQuantity: '150',
          unassignedCipCount: 0,
        },
      ],
      cashflow: {
        totalDisbursementSale: '45000000.00',
        totalEconomicResultSale: '45000000.00',
      },
    };

    const summary = ConsistencyEngine.evaluate(input);

    expect(summary.status).toBe('HEALTHY');
    expect(summary.criticalCount).toBe(0);
    expect(summary.warningCount).toBe(0);
    expect(summary.findings).toHaveLength(0);
    expect(summary.canCloseRevision).toBe(true);
    expect(summary.requiresJustification).toBe(false);
  });

  it('deve identificar erros críticos impeditivos de fechamento (RF-62, RF-63)', () => {
    const input: ConsistencyEngineInput = {
      offerId: 'off-1',
      stakingLines: [
        {
          lineId: 'line-1',
          lineName: 'LT 500kV',
          declaredTowersCount: 150,
          actualStakingCount: 148, // Divergência!
          invalidSoilFoundationPairsCount: 2, // 2 estruturas inválidas
        },
      ],
      materials: [
        {
          materialId: 'mat-1',
          materialName: 'Cabo OPGW 48 FO',
          quantity: '50000',
          hasSelectedQuote: false, // Sem cotação!
        },
        {
          materialId: 'mat-2',
          materialName: 'Isolador Polimérico 500kV',
          quantity: '900',
          hasSelectedQuote: true,
          originState: undefined, // Sem UF de origem!
          isTaxResolved: false,
        },
      ],
      scheduleActivities: [
        {
          lineId: 'line-1',
          activityId: 'act-2',
          activityName: 'Lançamento de Cabos',
          requiredDailyProduction: '3.0',
          maxTeamDailyProduction: '2.0', // Sobrecarga (Warning)
          isMilestoneExceeded: true, // Extrapolou LI/LO (Critical)
          contractMilestoneDate: '31/12/2027',
        },
      ],
      services: [
        {
          lineId: 'line-1',
          totalEngineeredQuantity: '150',
          totalBudgetedQuantity: '140', // Mismatch!
          unassignedCipCount: 1, // Warning
        },
      ],
      cashflow: {
        totalDisbursementSale: '45000000.00',
        totalEconomicResultSale: '47000000.00', // Divergência R$ 2M!
      },
    };

    const summary = ConsistencyEngine.evaluate(input);

    expect(summary.status).toBe('CRITICAL_ERRORS');
    expect(summary.criticalCount).toBe(7); // STK-001, STK-002, MAT-001, MAT-002, SCH-002, SRV-001, CSH-001
    expect(summary.warningCount).toBe(2); // SCH-001, SRV-002
    expect(summary.canCloseRevision).toBe(false);

    // Verifica deep linking
    const stk001 = summary.findings.find((f) => f.ruleId === 'STK-001');
    expect(stk001?.navigationTarget?.tab).toBe('staking');
    expect(stk001?.navigationTarget?.field).toBe('declaredTowersCount');

    const csh001 = summary.findings.find((f) => f.ruleId === 'CSH-001');
    expect(csh001?.navigationTarget?.tab).toBe('cashflow');
  });

  it('deve classificar como WARNINGS_ONLY quando houver apenas alertas operacionais', () => {
    const input: ConsistencyEngineInput = {
      offerId: 'off-1',
      scheduleActivities: [
        {
          lineId: 'line-1',
          activityId: 'act-1',
          activityName: 'Abertura de Picada',
          requiredDailyProduction: '2.5',
          maxTeamDailyProduction: '2.0', // Alerta
          isMilestoneExceeded: false,
        },
      ],
      histogramDeficits: [
        {
          month: 4,
          equipmentCode: 'EQ-TRAT-01',
          deficitCount: 2,
          hasStrategy: false, // Alerta
        },
      ],
    };

    const summary = ConsistencyEngine.evaluate(input);

    expect(summary.status).toBe('WARNINGS_ONLY');
    expect(summary.criticalCount).toBe(0);
    expect(summary.warningCount).toBe(2);
    expect(summary.canCloseRevision).toBe(true);
    expect(summary.requiresJustification).toBe(true);
  });
});
