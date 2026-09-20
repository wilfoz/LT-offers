import { Inject, Injectable } from '@nestjs/common';
import {
  TAX_RULES_QUERY_PORT_TOKEN,
  TaxRulesQueryPort,
  UfStateTaxProfile,
} from '../../domain';

@Injectable()
export class GetStatesUseCase {
  constructor(
    @Inject(TAX_RULES_QUERY_PORT_TOKEN)
    private readonly taxRulesQuery: TaxRulesQueryPort,
  ) {}

  /**
   * Retorna as UFs cadastradas com alíquota interna, FECOEP e método de DIFAL.
   */
  execute(): UfStateTaxProfile[] {
    return this.taxRulesQuery.findStates();
  }
}
