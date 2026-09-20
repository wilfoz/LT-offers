import { Controller, Get } from '@nestjs/common';
import { GetStatesUseCase } from '../../../application/usecases/get-states.usecase';
import { GetTaxRulesMapUseCase } from '../../../application/usecases/get-tax-rules-map.usecase';

@Controller('taxation')
export class TaxationController {
  constructor(
    private readonly getStatesUseCase: GetStatesUseCase,
    private readonly getTaxRulesMapUseCase: GetTaxRulesMapUseCase,
  ) {}

  @Get('states')
  getStates() {
    return this.getStatesUseCase.execute();
  }

  @Get('icms-matrix')
  getIcmsMatrix() {
    return this.getTaxRulesMapUseCase.getIcmsRulesMap();
  }

  @Get('ipi-rules')
  getIpiRules() {
    return this.getTaxRulesMapUseCase.getIpiRulesMap();
  }
}
