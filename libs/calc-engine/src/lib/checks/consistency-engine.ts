import {
  CheckFinding,
  CheckModule,
  CheckSeverity,
  OfferHealthStatus,
  OfferHealthSummary,
} from '@lt-offers/domain';
import { DecimalValue } from '../decimal-value';

export interface StakingCheckData {
  lineId: string;
  lineName?: string;
  declaredTowersCount?: number;
  actualStakingCount: number;
  invalidSoilFoundationPairsCount?: number;
  invalidPairsSample?: Array<{ structureNumber: string | number; soil: string; foundation: string }>;
}

export interface MaterialCheckData {
  lineId?: string;
  lineName?: string;
  materialId: string;
  materialName: string;
  quantity: number | string;
  hasSelectedQuote: boolean;
  originState?: string;
  isTaxResolved?: boolean;
}

export interface ScheduleCheckData {
  lineId: string;
  lineName?: string;
  activityId: string;
  activityName: string;
  requiredDailyProduction: number | string;
  maxTeamDailyProduction: number | string;
  endDate?: string;
  contractMilestoneDate?: string;
  isMilestoneExceeded?: boolean;
}

export interface HistogramCheckData {
  lineId?: string;
  lineName?: string;
  month: number;
  equipmentCode: string;
  equipmentName?: string;
  deficitCount: number;
  hasStrategy: boolean;
}

export interface ServiceCheckData {
  lineId: string;
  lineName?: string;
  totalEngineeredQuantity: number | string;
  totalBudgetedQuantity: number | string;
  unassignedCipCount: number;
}

export interface CashflowCheckData {
  totalDisbursementSale: number | string;
  totalEconomicResultSale: number | string;
}

export interface ConsistencyEngineInput {
  offerId: string;
  stakingLines?: StakingCheckData[];
  materials?: MaterialCheckData[];
  scheduleActivities?: ScheduleCheckData[];
  histogramDeficits?: HistogramCheckData[];
  services?: ServiceCheckData[];
  cashflow?: CashflowCheckData;
}

export class ConsistencyEngine {
  /**
   * Executa a bateria determinística de verificações de consistência cruzada (RF-62, RF-63, RNF-09).
   */
  static evaluate(input: ConsistencyEngineInput): OfferHealthSummary {
    const findings: CheckFinding[] = [];
    let idCounter = 1;

    const nextId = () => `chk-finding-${idCounter++}`;

    // 1. Verificações de Estaqueamento (STAKING)
    if (input.stakingLines) {
      for (const st of input.stakingLines) {
        if (
          st.declaredTowersCount !== undefined &&
          st.declaredTowersCount > 0 &&
          st.declaredTowersCount !== st.actualStakingCount
        ) {
          findings.push({
            id: nextId(),
            ruleId: 'STK-001',
            module: 'STAKING',
            severity: 'CRITICAL',
            title: 'Divergência na Contagem de Estruturas',
            message: `A linha ${st.lineName || st.lineId} possui ${st.actualStakingCount} estruturas no estaqueamento, mas a linha declara ${st.declaredTowersCount} estruturas.`,
            lineId: st.lineId,
            lineName: st.lineName,
            navigationTarget: {
              tab: 'staking',
              lineId: st.lineId,
              field: 'declaredTowersCount',
            },
          });
        }

        if (st.invalidSoilFoundationPairsCount && st.invalidSoilFoundationPairsCount > 0) {
          findings.push({
            id: nextId(),
            ruleId: 'STK-002',
            module: 'STAKING',
            severity: 'CRITICAL',
            title: 'Combinação Solo × Fundação Inexistente no Catálogo',
            message: `A linha ${st.lineName || st.lineId} possui ${st.invalidSoilFoundationPairsCount} estrutura(s) com tipos de fundação não previstos para o solo correspondente no catálogo DB_FUN.`,
            lineId: st.lineId,
            lineName: st.lineName,
            navigationTarget: {
              tab: 'staking',
              lineId: st.lineId,
              field: 'foundationType',
            },
          });
        }
      }
    }

    // 2. Verificações de Materiais & Tributos (MATERIALS_TAX)
    if (input.materials) {
      const missingQuotes = input.materials.filter((m) => {
        const qty = DecimalValue.of(m.quantity || '0');
        return !qty.isZero() && !m.hasSelectedQuote;
      });

      if (missingQuotes.length > 0) {
        findings.push({
          id: nextId(),
          ruleId: 'MAT-001',
          module: 'MATERIALS_TAX',
          severity: 'CRITICAL',
          title: 'Materiais com Quantitativo sem Cotação Selecionada (RF-29)',
          message: `Existem ${missingQuotes.length} item(ns) com quantitativo calculado sem fornecedor/preço selecionado (ex.: ${missingQuotes.slice(0, 3).map((m) => m.materialName).join(', ')}).`,
          navigationTarget: {
            tab: 'pricing',
            field: 'quoteSelection',
          },
        });
      }

      const unresolvedTaxes = input.materials.filter((m) => {
        const qty = DecimalValue.of(m.quantity || '0');
        return !qty.isZero() && (!m.originState || m.isTaxResolved === false);
      });

      if (unresolvedTaxes.length > 0) {
        findings.push({
          id: nextId(),
          ruleId: 'MAT-002',
          module: 'MATERIALS_TAX',
          severity: 'CRITICAL',
          title: 'Tributação de Materiais Indefinida',
          message: `Existem ${unresolvedTaxes.length} item(ns) sem UF de origem declarada ou sem cálculo tributário de ICMS/DIFAL resolvido.`,
          navigationTarget: {
            tab: 'tax',
            field: 'originState',
          },
        });
      }
    }

    // 3. Verificações de Cronograma & Recursos (SCHEDULE_RESOURCES)
    if (input.scheduleActivities) {
      for (const act of input.scheduleActivities) {
        const reqProd = DecimalValue.of(act.requiredDailyProduction || '0');
        const maxProd = DecimalValue.of(act.maxTeamDailyProduction || '0');

        if (!maxProd.isZero() && reqProd.greaterThan(maxProd)) {
          findings.push({
            id: nextId(),
            ruleId: 'SCH-001',
            module: 'SCHEDULE_RESOURCES',
            severity: 'WARNING',
            title: 'Sobrecarga de Produção da Equipe (RF-38)',
            message: `A atividade "${act.activityName}" exige produção diária de ${reqProd.toFixed(2)}, superior à capacidade máxima da equipe (${maxProd.toFixed(2)}).`,
            lineId: act.lineId,
            lineName: act.lineName,
            navigationTarget: {
              tab: 'schedule',
              lineId: act.lineId,
              entityId: act.activityId,
              field: 'requiredProduction',
            },
          });
        }

        if (act.isMilestoneExceeded) {
          findings.push({
            id: nextId(),
            ruleId: 'SCH-002',
            module: 'SCHEDULE_RESOURCES',
            severity: 'CRITICAL',
            title: 'Extrapolação de Marco Contratual LI / LO (RF-39)',
            message: `A atividade "${act.activityName}" na linha ${act.lineName || act.lineId} ultrapassa o marco contratual de entrada em operação (${act.contractMilestoneDate || 'Edital'}).`,
            lineId: act.lineId,
            lineName: act.lineName,
            navigationTarget: {
              tab: 'schedule',
              lineId: act.lineId,
              entityId: act.activityId,
              field: 'endDate',
            },
          });
        }
      }
    }

    // 4. Verificações de Histogramas & Canteiros (HISTOGRAM_CAMPS)
    if (input.histogramDeficits) {
      const uncoveredDeficits = input.histogramDeficits.filter(
        (h) => h.deficitCount > 0 && !h.hasStrategy
      );

      if (uncoveredDeficits.length > 0) {
        findings.push({
          id: nextId(),
          ruleId: 'HST-001',
          module: 'HISTOGRAM_CAMPS',
          severity: 'WARNING',
          title: 'Déficit de Equipamento sem Estratégia de Locação/Compra (RF-44)',
          message: `Existem ${uncoveredDeficits.length} ocorrência(s) de déficit de equipamentos próprios no histograma sem definição de aluguel ou compra associada.`,
          navigationTarget: {
            tab: 'histogram',
            field: 'equipmentDeficit',
          },
        });
      }
    }

    // 5. Verificações de Serviços & Orçamento (SERVICES_CONTRACT)
    if (input.services) {
      for (const srv of input.services) {
        const engQty = DecimalValue.of(srv.totalEngineeredQuantity || '0');
        const budQty = DecimalValue.of(srv.totalBudgetedQuantity || '0');

        if (!engQty.equals(budQty)) {
          findings.push({
            id: nextId(),
            ruleId: 'SRV-001',
            module: 'SERVICES_CONTRACT',
            severity: 'CRITICAL',
            title: 'Divergência de Quantitativo de Serviços vs Engenharia',
            message: `Na linha ${srv.lineName || srv.lineId}, a quantidade total de serviços orçados (${budQty.toFixed(2)}) difere do quantitativo físico consolidado da engenharia (${engQty.toFixed(2)}).`,
            lineId: srv.lineId,
            lineName: srv.lineName,
            navigationTarget: {
              tab: 'services',
              lineId: srv.lineId,
              field: 'budgetedQuantity',
            },
          });
        }

        if (srv.unassignedCipCount > 0) {
          findings.push({
            id: nextId(),
            ruleId: 'SRV-002',
            module: 'SERVICES_CONTRACT',
            severity: 'WARNING',
            title: 'Serviços sem Código CIP Contratual',
            message: `A linha ${srv.lineName || srv.lineId} possui ${srv.unassignedCipCount} item(ns) de serviço sem código CIP do contratante associado.`,
            lineId: srv.lineId,
            lineName: srv.lineName,
            navigationTarget: {
              tab: 'services',
              lineId: srv.lineId,
              field: 'cipCode',
            },
          });
        }
      }
    }

    // 6. Verificações de Desembolso & Caixa (CASHFLOW_DISBURSEMENT)
    if (input.cashflow) {
      const disbSale = DecimalValue.of(input.cashflow.totalDisbursementSale || '0').round(2, 'half-up');
      const econSale = DecimalValue.of(input.cashflow.totalEconomicResultSale || '0').round(2, 'half-up');

      if (!disbSale.equals(econSale) && (!disbSale.isZero() || !econSale.isZero())) {
        findings.push({
          id: nextId(),
          ruleId: 'CSH-001',
          module: 'CASHFLOW_DISBURSEMENT',
          severity: 'CRITICAL',
          title: 'Divergência entre Desembolso e Preço de Venda do Quadro R',
          message: `A soma total do fluxo de desembolso (R$ ${disbSale.toFixed(2)}) difere do Preço de Venda consolidado do Quadro R (R$ ${econSale.toFixed(2)}).`,
          navigationTarget: {
            tab: 'cashflow',
            field: 'totalDisbursementSale',
          },
        });
      }
    }

    let criticalCount = 0;
    let warningCount = 0;
    let infoCount = 0;

    for (const f of findings) {
      if (f.severity === 'CRITICAL') criticalCount++;
      else if (f.severity === 'WARNING') warningCount++;
      else if (f.severity === 'INFO') infoCount++;
    }

    let status: OfferHealthStatus = 'HEALTHY';
    if (criticalCount > 0) {
      status = 'CRITICAL_ERRORS';
    } else if (warningCount > 0) {
      status = 'WARNINGS_ONLY';
    }

    return {
      offerId: input.offerId,
      status,
      criticalCount,
      warningCount,
      infoCount,
      findings,
      canCloseRevision: criticalCount === 0,
      requiresJustification: warningCount > 0 && criticalCount === 0,
    };
  }
}
