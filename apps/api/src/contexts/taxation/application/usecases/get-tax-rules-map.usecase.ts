import { Inject, Injectable } from '@nestjs/common';
import { IcmsRule, IpiRule, PisCofinsRule, TaxRegime } from '@lt-offers/domain';
import {
  buildIcmsRulesMap,
  resolvePisCofinsRule,
  TAX_RULES_QUERY_PORT_TOKEN,
  TaxRulesQueryPort,
} from '../../domain';

@Injectable()
export class GetTaxRulesMapUseCase {
  constructor(
    @Inject(TAX_RULES_QUERY_PORT_TOKEN)
    private readonly taxRulesQuery: TaxRulesQueryPort,
  ) {}

  /**
   * Matriz completa de ICMS interestadual derivada dos perfis das UFs.
   */
  getIcmsRulesMap(): Record<string, IcmsRule> {
    return buildIcmsRulesMap(this.taxRulesQuery.findStates());
  }

  /**
   * Mapa de regras de IPI por NCM.
   */
  getIpiRulesMap(): Record<string, IpiRule> {
    return { ...this.taxRulesQuery.findIpiRules() };
  }

  /**
   * Regra de PIS/COFINS aplicável ao regime tributário.
   */
  getPisCofinsRule(regime: TaxRegime): PisCofinsRule {
    return resolvePisCofinsRule(regime);
  }
}
