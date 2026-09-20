import { EconomicsDataQueryPort, EconomicsLineData } from '../../domain';
import { GetLineServiceBudgetUseCase } from './get-line-service-budget.usecase';
import { GetLineMeasurementSheetUseCase } from './get-line-measurement-sheet.usecase';
import { GetLineEconomicResultUseCase } from './get-line-economic-result.usecase';
import { GetConsolidatedEconomicResultUseCase } from './get-consolidated-economic-result.usecase';
import { SimulateMarginOrPriceUseCase } from './simulate-margin-or-price.usecase';
import { CompareRevisionsUseCase } from './compare-revisions.usecase';
import { GetLineCashflowUseCase } from './get-line-cashflow.usecase';
import { GetConsolidatedCashflowUseCase } from './get-consolidated-cashflow.usecase';

describe('Casos de uso do contexto economics (M09, M10, M11)', () => {
  let port: {
    findLineEconomicsData: jest.Mock;
    findOfferLineIds: jest.Mock;
  };

  const lineData: EconomicsLineData = {
    id: 1,
    name: 'LT 500 kV Linha 1',
    refinedLengthKm: '100.00',
    reportLengthKm: '100.00',
    offerId: 100,
  };

  const asPort = (): EconomicsDataQueryPort =>
    port as unknown as EconomicsDataQueryPort;

  beforeEach(() => {
    port = {
      findLineEconomicsData: jest.fn().mockResolvedValue(lineData),
      findOfferLineIds: jest.fn().mockResolvedValue([1]),
    };
  });

  describe('Orçamento de serviços (M09)', () => {
    it('deve calcular o orçamento de serviços de uma linha válida', async () => {
      const useCase = new GetLineServiceBudgetUseCase(asPort());
      const summary = await useCase.execute(1);

      expect(summary).toBeDefined();
      expect(summary.lineId).toBe('1');
      expect(summary.items.length).toBe(6);
      expect(Number(summary.totalDirectCost)).toBeGreaterThan(0);
      expect(Number(summary.totalSalePrice)).toBeGreaterThan(
        Number(summary.totalDirectCost),
      );
      expect(summary.ratios.costPerKm).toBeDefined();
    });

    it('deve lançar exceção de domínio quando a linha não existe', async () => {
      port.findLineEconomicsData.mockResolvedValue(null);
      const useCase = new GetLineServiceBudgetUseCase(asPort());

      await expect(useCase.execute(99)).rejects.toThrow(
        'Linha de transmissão ID 99 não encontrada.',
      );
    });

    it('deve retornar os itens do orçamento como folha de medição', async () => {
      const budget = new GetLineServiceBudgetUseCase(asPort());
      const useCase = new GetLineMeasurementSheetUseCase(budget);
      const items = await useCase.execute(1);

      expect(items.length).toBe(6);
      expect(items[0].cipCode).toBe('GR01.01.01');
    });
  });

  describe('Resultado econômico (M10)', () => {
    it('deve calcular o resultado econômico de uma linha', async () => {
      const useCase = new GetLineEconomicResultUseCase(asPort());
      const result = await useCase.execute(1);

      expect(result).toBeDefined();
      expect(result.lines.length).toBeGreaterThanOrEqual(3);
      expect(Number(result.totalCostWithTaxes)).toBeGreaterThan(0);
      expect(Number(result.totalSalePrice)).toBeGreaterThan(
        Number(result.totalCostWithTaxes),
      );
      expect(result.bdi.effectiveBdiRate).toBeDefined();
      expect(result.coefficients).toBeDefined();
    });

    it('deve consolidar o resultado da oferta somando as linhas', async () => {
      port.findOfferLineIds.mockResolvedValue([1, 2]);
      port.findLineEconomicsData.mockResolvedValue(lineData);

      const lineUseCase = new GetLineEconomicResultUseCase(asPort());
      const useCase = new GetConsolidatedEconomicResultUseCase(
        asPort(),
        lineUseCase,
      );
      const consolidated = await useCase.execute(100);
      const single = await lineUseCase.execute(1);

      expect(consolidated.lineName).toBe(
        'Consolidado (2 Linhas de Transmissão)',
      );
      expect(Number(consolidated.totalSalePrice)).toBeCloseTo(
        2 * Number(single.totalSalePrice),
        2,
      );
    });

    it('deve lançar exceção de domínio quando a oferta não existe', async () => {
      port.findOfferLineIds.mockResolvedValue(null);
      const lineUseCase = new GetLineEconomicResultUseCase(asPort());
      const useCase = new GetConsolidatedEconomicResultUseCase(
        asPort(),
        lineUseCase,
      );

      await expect(useCase.execute(999)).rejects.toThrow(
        'Oferta ID 999 não encontrada.',
      );
    });

    it('deve simular margem e preço para uma oferta', async () => {
      const lineUseCase = new GetLineEconomicResultUseCase(asPort());
      const consolidatedUseCase = new GetConsolidatedEconomicResultUseCase(
        asPort(),
        lineUseCase,
      );
      const useCase = new SimulateMarginOrPriceUseCase(
        lineUseCase,
        consolidatedUseCase,
      );

      const output = await useCase.execute(100, {
        targetMarginRate: '10.00',
      });

      expect(output).toBeDefined();
      expect(output.resultingNetMarginRate).toBe('10.00');
      expect(Number(output.simulatedSalePrice)).toBeGreaterThan(0);
    });

    it('deve comparar revisões com margens de referência distintas', async () => {
      const lineUseCase = new GetLineEconomicResultUseCase(asPort());
      const consolidatedUseCase = new GetConsolidatedEconomicResultUseCase(
        asPort(),
        lineUseCase,
      );
      const useCase = new CompareRevisionsUseCase(consolidatedUseCase);

      const result = await useCase.execute(100, 0, 1);

      expect(result).toBeDefined();
      expect(result.baseRevisionNumber).toBe(0);
      expect(result.targetRevisionNumber).toBe(1);
    });
  });

  describe('Fluxo de desembolso (M11)', () => {
    it('deve calcular o fluxo de caixa de uma linha com 18 meses', async () => {
      const useCase = new GetLineCashflowUseCase(asPort());
      const result = await useCase.execute(1);

      expect(result).toBeDefined();
      expect(result.monthlyPoints.length).toBe(18);
      expect(Number(result.totalInflow)).toBeGreaterThan(0);
      expect(Number(result.totalOutflow)).toBeGreaterThan(0);
      expect(result.financialExposure).toBeDefined();
    });

    it('deve consolidar o fluxo de caixa da oferta somando as linhas mês a mês', async () => {
      port.findOfferLineIds.mockResolvedValue([1, 2]);

      const lineUseCase = new GetLineCashflowUseCase(asPort());
      const useCase = new GetConsolidatedCashflowUseCase(asPort(), lineUseCase);

      const consolidated = await useCase.execute(100);
      const single = await lineUseCase.execute(1);

      expect(consolidated.lineName).toBe('Fluxo de Caixa Consolidado (2 LTs)');
      expect(consolidated.monthlyPoints.length).toBe(single.totalMonths);
      expect(Number(consolidated.totalOutflow)).toBeCloseTo(
        2 * Number(single.totalOutflow),
        2,
      );
      expect(
        consolidated.financialExposure.recommendedWorkingCapital,
      ).toBeDefined();
    });

    it('deve repassar parâmetros de adiantamento, retenção e defasagem', async () => {
      const useCase = new GetLineCashflowUseCase(asPort());
      const custom = await useCase.execute(1, {
        advanceRate: 20,
        retentionRate: 0,
        billingLag: 0,
      });
      const standard = await useCase.execute(1);

      expect(Number(custom.monthlyPoints[0].advanceBilling)).toBeGreaterThan(
        Number(standard.monthlyPoints[0].advanceBilling),
      );
    });
  });
});
