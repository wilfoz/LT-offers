import { Controller, Get } from '@nestjs/common';
import { TaxTablesService } from './tax-tables.service';

@Controller('taxation')
export class TaxationController {
  constructor(private readonly taxTablesService: TaxTablesService) {}

  @Get('states')
  getStates() {
    return this.taxTablesService.getStates();
  }

  @Get('icms-matrix')
  getIcmsMatrix() {
    return this.taxTablesService.getIcmsRulesMap();
  }

  @Get('ipi-rules')
  getIpiRules() {
    return this.taxTablesService.getIpiRulesMap();
  }
}
