import { Test } from '@nestjs/testing';
import { TAX_RULES_QUERY_PORT_TOKEN } from '../../../domain';
import { GetStatesUseCase } from '../../../application/usecases/get-states.usecase';
import { GetTaxRulesMapUseCase } from '../../../application/usecases/get-tax-rules-map.usecase';
import { StaticTaxTablesAdapter } from '../../static/static-tax-tables.adapter';
import { TaxationController } from './taxation.controller';

describe('TaxationController (contratos de /api/taxation)', () => {
  let controller: TaxationController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TaxationController],
      providers: [
        GetStatesUseCase,
        GetTaxRulesMapUseCase,
        {
          provide: TAX_RULES_QUERY_PORT_TOKEN,
          useClass: StaticTaxTablesAdapter,
        },
      ],
    }).compile();

    controller = moduleRef.get(TaxationController);
  });

  it('GET states deve retornar as 27 UFs com o envelope do legado', () => {
    const states = controller.getStates();
    expect(states.length).toBe(27);
    expect(states.find((s) => s.code === 'SP')).toEqual({
      code: 'SP',
      name: 'São Paulo',
      internalRate: 18.0,
      fecoepRate: 0.0,
      difalMethod: 'SINGLE_BASE',
    });
  });

  it('GET icms-matrix deve retornar a matriz completa origem->destino', () => {
    const rules = controller.getIcmsMatrix();
    expect(Object.keys(rules).length).toBe(27 * 27);
    expect(rules['SP->MG']).toEqual({
      originState: 'SP',
      destinationState: 'MG',
      interstateRatePercent: 12.0,
      internalDestinationRatePercent: 18.0,
      fecoepRatePercent: 2.0,
      difalMethod: 'DOUBLE_BASE',
    });
  });

  it('GET ipi-rules deve retornar o catálogo de IPI por NCM', () => {
    const ipi = controller.getIpiRules();
    expect(ipi['8546.10.00']).toEqual({
      ncmCode: '8546.10.00',
      description: 'Isoladores elétricos de vidro',
      ratePercent: 6.5,
    });
  });
});
