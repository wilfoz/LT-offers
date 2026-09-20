import { Injectable } from '@nestjs/common';
import { IcmsRule, IpiRule, PisCofinsRule, TaxRegime } from '@lt-offers/domain';
import { UfStateTaxProfile } from '../../domain';
import { GetStatesUseCase } from '../usecases/get-states.usecase';
import { GetTaxRulesMapUseCase } from '../usecases/get-tax-rules-map.usecase';

/**
 * Facade de aplicação do contexto de tributação para consumo por outros
 * contextos (ex.: pricing). Superfície mínima: tabelas e regras derivadas.
 */
@Injectable()
export class TaxationFacadeService {
  constructor(
    private readonly getStatesUseCase: GetStatesUseCase,
    private readonly getTaxRulesMapUseCase: GetTaxRulesMapUseCase,
  ) {}

  getStates(): UfStateTaxProfile[] {
    return this.getStatesUseCase.execute();
  }

  getIcmsRulesMap(): Record<string, IcmsRule> {
    return this.getTaxRulesMapUseCase.getIcmsRulesMap();
  }

  getIpiRulesMap(): Record<string, IpiRule> {
    return this.getTaxRulesMapUseCase.getIpiRulesMap();
  }

  getPisCofinsRule(regime: TaxRegime): PisCofinsRule {
    return this.getTaxRulesMapUseCase.getPisCofinsRule(regime);
  }
}
