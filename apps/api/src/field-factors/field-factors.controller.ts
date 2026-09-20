import { Controller, Get, Param, Post, Body, UseGuards } from '@nestjs/common';
import { FieldFactorsService } from './field-factors.service';
import { AccessDifficulty } from '@lt-offers/domain';
import { RolesGuard } from '../auth/roles.guard';

@Controller('field-factors')
@UseGuards(RolesGuard)
export class FieldFactorsController {
  constructor(private readonly fieldFactorsService: FieldFactorsService) {}

  @Get('access-weights')
  getAccessWeights() {
    return this.fieldFactorsService.getAccessWeights();
  }

  @Get('geotechnical')
  getGeotechnicalFactors() {
    return this.fieldFactorsService.getGeotechnicalFactors();
  }

  @Post('calculate-access')
  calculateWeightedAccess(
    @Body()
    payload: {
      distribution: { difficulty: AccessDifficulty; count: number }[];
    },
  ) {
    return this.fieldFactorsService.calculateWeightedAccess(
      payload.distribution || [],
    );
  }

  @Get('precipitation/ufs')
  getAllPrecipitationUfs() {
    return this.fieldFactorsService.getAllPrecipitationUfs();
  }

  @Get('precipitation/ufs/:uf')
  getPrecipitationByUf(@Param('uf') uf: string) {
    return this.fieldFactorsService.getPrecipitationByUf(uf);
  }
}
