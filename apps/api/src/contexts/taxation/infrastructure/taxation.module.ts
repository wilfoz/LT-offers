import { Module } from '@nestjs/common';
import { TAX_RULES_QUERY_PORT_TOKEN } from '../domain';
import {
  GetStatesUseCase,
  GetTaxRulesMapUseCase,
  TaxationFacadeService,
} from '../application';
import { StaticTaxTablesAdapter } from './static/static-tax-tables.adapter';
import { TaxationController } from './http/controllers/taxation.controller';

const useCases = [
  GetStatesUseCase,
  GetTaxRulesMapUseCase,
  TaxationFacadeService,
];

@Module({
  controllers: [TaxationController],
  providers: [
    StaticTaxTablesAdapter,
    {
      provide: TAX_RULES_QUERY_PORT_TOKEN,
      useClass: StaticTaxTablesAdapter,
    },
    ...useCases,
  ],
  // Fronteira do contexto: consumidores externos enxergam apenas a fachada
  // (design, decisão 2); portas e use cases são internos ao módulo.
  exports: [TaxationFacadeService],
})
export class TaxationModule {}
