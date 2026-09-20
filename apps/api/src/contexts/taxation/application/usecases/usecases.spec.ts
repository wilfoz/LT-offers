import { IpiRule } from '@lt-offers/domain';
import {
  buildIcmsRulesMap,
  TaxRulesQueryPort,
  UfStateTaxProfile,
} from '../../domain';
import { StaticTaxTablesAdapter } from '../../infrastructure/static/static-tax-tables.adapter';
import { GetStatesUseCase } from './get-states.usecase';
import { GetTaxRulesMapUseCase } from './get-tax-rules-map.usecase';

// O adaptador estático é puro (sem I/O) e carrega as tabelas oficiais:
// usá-lo como porta preserva as asserções de dados reais do spec legado.
describe('Casos de uso de tributação (RF-33, RNF-15)', () => {
  let getStates: GetStatesUseCase;
  let getTaxRules: GetTaxRulesMapUseCase;

  beforeEach(() => {
    const port = new StaticTaxTablesAdapter();
    getStates = new GetStatesUseCase(port);
    getTaxRules = new GetTaxRulesMapUseCase(port);
  });

  it('deve retornar lista com as 27 UFs brasileiras', () => {
    const states = getStates.execute();
    expect(states.length).toBe(27);
    const sp = states.find((s) => s.code === 'SP');
    const mg = states.find((s) => s.code === 'MG');
    expect(sp?.internalRate).toBe(18);
    expect(mg?.difalMethod).toBe('DOUBLE_BASE');
    expect(mg?.fecoepRate).toBe(2.0);
  });

  it('deve gerar matriz de ICMS interestadual com 7% de Sul/Sudeste para N/NE/CO/ES', () => {
    const rules = getTaxRules.getIcmsRulesMap();
    expect(rules['SP->MG'].interstateRatePercent).toBe(12.0); // Sul/Sudeste para Sul/Sudeste = 12%
    expect(rules['SP->BA'].interstateRatePercent).toBe(7.0); // Sul/Sudeste para Nordeste = 7%
    expect(rules['MG->SP'].interstateRatePercent).toBe(12.0);
  });

  it('deve retornar regras de IPI por NCM', () => {
    const ipi = getTaxRules.getIpiRulesMap();
    expect(ipi['7308.20.00'].ratePercent).toBe(3.25);
    expect(ipi['7614.10.10'].ratePercent).toBe(0.0);
  });

  it('deve retornar alíquotas zeradas para PIS/COFINS sob REIDI', () => {
    const pisCofins = getTaxRules.getPisCofinsRule('REIDI');
    expect(pisCofins.pisRatePercent).toBe(0);
    expect(pisCofins.cofinsRatePercent).toBe(0);
  });

  it('deve derivar a matriz de ICMS de qualquer porta injetada (dublê mínimo)', () => {
    const fakePort: TaxRulesQueryPort = {
      findStates: (): UfStateTaxProfile[] => [
        {
          code: 'SP',
          name: 'São Paulo',
          internalRate: 18.0,
          fecoepRate: 0.0,
          difalMethod: 'SINGLE_BASE',
        },
        {
          code: 'BA',
          name: 'Bahia',
          internalRate: 19.0,
          fecoepRate: 1.0,
          difalMethod: 'DOUBLE_BASE',
        },
      ],
      findIpiRules: (): Record<string, IpiRule> => ({}),
    };

    const rules = buildIcmsRulesMap(fakePort.findStates());
    expect(rules['SP->SP'].interstateRatePercent).toBe(18.0); // interna usa alíquota do destino
    expect(rules['SP->BA'].interstateRatePercent).toBe(7.0);
    expect(rules['BA->SP'].interstateRatePercent).toBe(12.0);
    expect(rules['SP->BA'].fecoepRatePercent).toBe(1.0);
  });
});
