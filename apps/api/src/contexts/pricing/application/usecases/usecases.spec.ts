import { FoundationsFacadeService } from '../../../foundations';
import {
  GetStatesUseCase,
  GetTaxRulesMapUseCase,
  TaxationFacadeService,
  StaticTaxTablesAdapter,
} from '../../../taxation';
import { PricingDataQueryPort, PricingLineData } from '../../domain';
import { StaticQuotesAdapter } from '../../infrastructure/static/static-quotes.adapter';
import { CalculateLinePricingUseCase } from './calculate-line-pricing.usecase';
import { GetQuotesUseCase } from './get-quotes.usecase';

describe('Casos de uso de precificação (RF-28..RF-34)', () => {
  let calculateUseCase: CalculateLinePricingUseCase;
  let getQuotesUseCase: GetQuotesUseCase;
  let pricingDataPort: { findLinePricingData: jest.Mock };
  let foundationsFacadeMock: { getLineFoundationSummary: jest.Mock };

  const lineData: PricingLineData = {
    id: 1,
    name: 'LT 500 kV Poções III - Padre Paraíso C1',
    refinedLengthKm: '100.0',
    reportLengthKm: '100.0',
    destinationStatePrimary: 'MG',
    destinationPercentagePrimary: '100.0',
    destinationStateSecondary: null,
    destinationPercentageSecondary: null,
  };

  beforeEach(() => {
    pricingDataPort = {
      findLinePricingData: jest.fn().mockResolvedValue(lineData),
    };

    foundationsFacadeMock = {
      getLineFoundationSummary: jest.fn().mockResolvedValue({
        lineId: 1,
        materials: [
          {
            field: 'concreteFootingsM3',
            name: 'Concreto Estrutural de Sapata',
            family: 'CONCRETE',
            unit: 'm³',
            totalQuantity: '500.000',
          },
        ],
      }),
    };

    const taxTablesPort = new StaticTaxTablesAdapter();
    const taxationFacade = new TaxationFacadeService(
      new GetStatesUseCase(taxTablesPort),
      new GetTaxRulesMapUseCase(taxTablesPort),
    );
    const quotesAdapter = new StaticQuotesAdapter();

    calculateUseCase = new CalculateLinePricingUseCase(
      pricingDataPort as unknown as PricingDataQueryPort,
      quotesAdapter,
      foundationsFacadeMock as unknown as FoundationsFacadeService,
      taxationFacade,
    );
    getQuotesUseCase = new GetQuotesUseCase(quotesAdapter);
  });

  it('deve calcular o resumo financeiro e tributário da linha com sucesso', async () => {
    const summary = await calculateUseCase.execute(1, {
      taxRegime: 'REIDI',
    });

    expect(summary.lineId).toBe('1');
    expect(summary.taxRegime).toBe('REIDI');
    expect(summary.items.length).toBeGreaterThan(0);
    expect(summary.totalNetAmount).toBeGreaterThan(0);
    expect(summary.totalGrossAmount).toBeGreaterThan(summary.totalNetAmount);
    expect(summary.totalReidiSavings).toBeGreaterThan(0);
    expect(summary.missingPriceItemCodes.length).toBe(0);
  });

  it('deve suportar simulação alterando regime e cotações de commodities', async () => {
    const summary = await calculateUseCase.execute(1, {
      taxRegime: 'STANDARD',
      spotLmeUsdPerTon: 2800,
      spotExchangeRateBrl: 6.0,
    });

    expect(summary.taxRegime).toBe('STANDARD');
    expect(summary.totalPisAmount).toBeGreaterThan(0);
    expect(summary.totalCofinsAmount).toBeGreaterThan(0);
    expect(summary.totalReidiSavings).toBe(0);
  });

  it('deve lançar exceção de domínio quando a linha não existe', async () => {
    pricingDataPort.findLinePricingData.mockResolvedValue(null);

    await expect(calculateUseCase.execute(99)).rejects.toThrow(
      'Linha de transmissão com ID 99 não encontrada',
    );
  });

  it('deve listar as cotações cadastradas na ordem do catálogo', () => {
    const quotes = getQuotesUseCase.execute();
    expect(quotes.length).toBe(8);
    expect(quotes[0].materialCode).toBe('MAT-TOR-EST');
  });
});
