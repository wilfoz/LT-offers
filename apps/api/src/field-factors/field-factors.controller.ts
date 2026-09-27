import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FieldFactorsService } from './field-factors.service';
import { AccessDifficulty } from '@lt-offers/domain';
import { RolesGuard } from '../auth/roles.guard';
import { resolveReferenceDate } from '../contexts/catalogs/infrastructure/http/controller-shared';
import { handleScheduleParametersError } from '../contexts/schedule/infrastructure/controllers/schedule-parameters.controller';

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
  async getAllPrecipitationUfs(@Query('effectiveOn') effectiveOn?: string) {
    try {
      // Data de referência resolvida na borda (design D2); default = hoje civil.
      const refDate = resolveReferenceDate(effectiveOn);
      return await this.fieldFactorsService.getAllPrecipitationUfs(
        refDate.toIsoDateString(),
      );
    } catch (error) {
      handleScheduleParametersError(error);
    }
  }

  @Get('precipitation/ufs/:uf')
  async getPrecipitationByUf(
    @Param('uf') uf: string,
    @Query('effectiveOn') effectiveOn?: string,
  ) {
    try {
      const refDate = resolveReferenceDate(effectiveOn);
      return await this.fieldFactorsService.getPrecipitationByUf(
        uf,
        refDate.toIsoDateString(),
      );
    } catch (error) {
      handleScheduleParametersError(error);
    }
  }
}
