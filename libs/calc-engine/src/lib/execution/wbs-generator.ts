import {
  ErpAccountMapping,
  ErpIntegrationPackage,
  ErpScheduleEntry,
  ErpTargetSystem,
  WorkBaseline,
  WorkPackageCategory,
  WorkPackageItem,
} from '@lt-offers/domain';
import { DecimalValue } from '../decimal-value';

export class WbsGenerator {
  /**
   * Gera a lista padrão de pacotes de trabalho (EAP/WBS) da Baseline a partir dos custos da proposta.
   */
  static generateDefaultWorkPackages(params: {
    totalContractValue: string;
    totalBudgetCost: string;
    engineeringCost?: string;
    environmentalCost?: string;
    civilCost?: string;
    electromechanicalCost?: string;
    cablesCost?: string;
    commissioningCost?: string;
    indirectsCost?: string;
    lineCode?: string;
  }): WorkPackageItem[] {
    const totalBudget = DecimalValue.of(params.totalBudgetCost || '10000000');
    
    // Custos por categoria ou estimativa ponderada padrão do setor LT
    const engCost = params.engineeringCost ? DecimalValue.of(params.engineeringCost) : totalBudget.times(DecimalValue.of('0.05')).round(2, 'half-up');
    const envCost = params.environmentalCost ? DecimalValue.of(params.environmentalCost) : totalBudget.times(DecimalValue.of('0.08')).round(2, 'half-up');
    const civCost = params.civilCost ? DecimalValue.of(params.civilCost) : totalBudget.times(DecimalValue.of('0.27')).round(2, 'half-up');
    const elmCost = params.electromechanicalCost ? DecimalValue.of(params.electromechanicalCost) : totalBudget.times(DecimalValue.of('0.30')).round(2, 'half-up');
    const cabCost = params.cablesCost ? DecimalValue.of(params.cablesCost) : totalBudget.times(DecimalValue.of('0.15')).round(2, 'half-up');
    const comCost = params.commissioningCost ? DecimalValue.of(params.commissioningCost) : totalBudget.times(DecimalValue.of('0.03')).round(2, 'half-up');
    const indCost = params.indirectsCost ? DecimalValue.of(params.indirectsCost) : totalBudget.times(DecimalValue.of('0.12')).round(2, 'half-up');

    const rawPackages: Array<{
      wbsCode: string;
      name: string;
      category: WorkPackageCategory;
      cost: DecimalValue;
      unit: string;
      qty: string;
      cipAccount: string;
    }> = [
      {
        wbsCode: '01.01',
        name: 'Projetos Básicos, Executivos & Levantamento Topográfico',
        category: 'PROJECT_TOPOGRAPHY',
        cost: engCost,
        unit: 'vb',
        qty: '1.00',
        cipAccount: 'CIP-01-ENG',
      },
      {
        wbsCode: '02.01',
        name: 'Liberação de Faixa de Servidão, Meio Ambiente & Acessos',
        category: 'ENVIRONMENT_EASEMENT',
        cost: envCost,
        unit: 'km',
        qty: '100.00',
        cipAccount: 'CIP-02-AMB',
      },
      {
        wbsCode: '03.01',
        name: 'Abertura de Cavas, Armação & Concretagem de Fundações',
        category: 'CIVIL_FOUNDATIONS',
        cost: civCost,
        unit: 'm3',
        qty: '2500.00',
        cipAccount: 'CIP-03-CIV',
      },
      {
        wbsCode: '04.01',
        name: 'Montagem de Torres Autoportantes e Estaiadas',
        category: 'ELECTROMECHANICAL_ASSEMBLY',
        cost: elmCost,
        unit: 't',
        qty: '1800.00',
        cipAccount: 'CIP-04-ELM',
      },
      {
        wbsCode: '05.01',
        name: 'Lançamento, Regulagem & Tensionamento de Condutores e OPGW',
        category: 'CABLE_STRINGING',
        cost: cabCost,
        unit: 'km',
        qty: '100.00',
        cipAccount: 'CIP-05-CAB',
      },
      {
        wbsCode: '06.01',
        name: 'Comissionamento, Ensaios de Continuidade & Energização',
        category: 'COMMISSIONING',
        cost: comCost,
        unit: 'un',
        qty: '1.00',
        cipAccount: 'CIP-06-COM',
      },
      {
        wbsCode: '07.01',
        name: 'Administração Local, Canteiro, Logística & Gestão',
        category: 'INDIRECTS_MANAGEMENT',
        cost: indCost,
        unit: 'mes',
        qty: '12.00',
        cipAccount: 'CIP-07-IND',
      },
    ];

    const sumCost = rawPackages.reduce((acc, p) => acc.plus(p.cost), DecimalValue.zero());
    const denom = sumCost.isZero() ? DecimalValue.of(1) : sumCost;

    return rawPackages.map((p, idx) => {
      const weight = p.cost.times(DecimalValue.of(100)).dividedBy(denom).round(2, 'half-up');
      return {
        id: idx + 1,
        wbsCode: p.wbsCode,
        name: p.name,
        category: p.category,
        budgetedCost: p.cost.toFixed(2, 'half-up'),
        weightPercent: weight.toFixed(2, 'half-up'),
        unit: p.unit,
        plannedQuantity: p.qty,
        lineCode: params.lineCode || 'LT-01',
        cipAccountCode: p.cipAccount,
      };
    });
  }

  /**
   * Gera o pacote canônico de integração ERP a partir da Baseline e da EAP.
   */
  static generateErpPackage(params: {
    baseline: WorkBaseline;
    offerCode: string;
    offerName: string;
    revisionNumber: number;
    targetSystem: ErpTargetSystem;
    companyCode?: string;
    generatedBy: string;
  }): ErpIntegrationPackage {
    const companyCode = params.companyCode || (params.targetSystem === 'SAP' ? '1000' : 'COLIG-01');

    const accounts: ErpAccountMapping[] = params.baseline.workPackages.map((wp, index) => {
      const ccCode = `CC-${params.offerCode}-${wp.wbsCode.replace('.', '')}`;
      const glAccount = `1.1.05.00${index + 1}`;
      const budgetAccount = `ORC-${wp.category.substring(0, 3)}-${wp.wbsCode.replace('.', '')}`;

      return {
        costCenterCode: ccCode,
        costCenterName: `${wp.name.substring(0, 35)}`,
        generalLedgerAccount: glAccount,
        budgetAccountCode: budgetAccount,
        wbsCode: wp.wbsCode,
        description: wp.name,
        unit: wp.unit,
        totalBudgetedCost: wp.budgetedCost,
      };
    });

    // Distribuição linear padrão nos meses da baseline
    const months = params.baseline.scheduleMonths || 12;
    const monthlySchedule: ErpScheduleEntry[] = [];
    const baseYear = new Date().getFullYear();

    for (let m = 1; m <= months; m++) {
      const monthStr = m < 10 ? `0${m}` : `${m}`;
      const periodDate = `${baseYear}-${monthStr}`;

      for (const acc of accounts) {
        const total = DecimalValue.of(acc.totalBudgetedCost);
        const monthlyCost = total.dividedBy(DecimalValue.of(months)).round(2, 'half-up');

        monthlySchedule.push({
          monthNumber: m,
          periodDate,
          costCenterCode: acc.costCenterCode,
          wbsCode: acc.wbsCode,
          plannedCostAmount: monthlyCost.toFixed(2, 'half-up'),
          plannedDisbursementAmount: monthlyCost.toFixed(2, 'half-up'),
          currency: 'BRL',
        });
      }
    }

    return {
      offerCode: params.offerCode,
      offerName: params.offerName,
      revisionNumber: params.revisionNumber,
      baselineNumber: params.baseline.baselineNumber,
      baselineFrozenAt: params.baseline.frozenAt,
      targetSystem: params.targetSystem,
      generatedAt: new Date().toISOString(),
      generatedBy: params.generatedBy,
      companyCode,
      totalContractValue: params.baseline.totalContractValue,
      totalBudgetCost: params.baseline.totalBudgetCost,
      currency: 'BRL',
      accounts,
      monthlySchedule,
    };
  }
}
