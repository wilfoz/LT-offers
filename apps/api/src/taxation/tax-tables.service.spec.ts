import { TaxTablesService } from './tax-tables.service';

describe('TaxTablesService (RF-33, RNF-15)', () => {
  let service: TaxTablesService;

  beforeEach(() => {
    service = new TaxTablesService();
  });

  it('deve retornar lista com as 27 UFs brasileiras', () => {
    const states = service.getStates();
    expect(states.length).toBe(27);
    const sp = states.find((s) => s.code === 'SP');
    const mg = states.find((s) => s.code === 'MG');
    expect(sp?.internalRate).toBe(18);
    expect(mg?.difalMethod).toBe('DOUBLE_BASE');
    expect(mg?.fecoepRate).toBe(2.0);
  });

  it('deve gerar matriz de ICMS interestadual com 7% de Sul/Sudeste para N/NE/CO/ES', () => {
    const rules = service.getIcmsRulesMap();
    expect(rules['SP->MG'].interstateRatePercent).toBe(12.0); // Sul/Sudeste para Sul/Sudeste = 12%
    expect(rules['SP->BA'].interstateRatePercent).toBe(7.0); // Sul/Sudeste para Nordeste = 7%
    expect(rules['MG->SP'].interstateRatePercent).toBe(12.0);
  });

  it('deve retornar regras de IPI por NCM', () => {
    const ipi = service.getIpiRulesMap();
    expect(ipi['7308.20.00'].ratePercent).toBe(3.25);
    expect(ipi['7614.10.10'].ratePercent).toBe(0.0);
  });

  it('deve retornar alíquotas zeradas para PIS/COFINS sob REIDI', () => {
    const pisCofins = service.getPisCofinsRule('REIDI');
    expect(pisCofins.pisRatePercent).toBe(0);
    expect(pisCofins.cofinsRatePercent).toBe(0);
  });
});
