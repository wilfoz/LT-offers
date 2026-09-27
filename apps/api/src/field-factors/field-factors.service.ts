import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ACCESS_SEVERITY_WEIGHTS,
  DEFAULT_GEOTECHNICAL_FACTORS,
  PrecipitationUfData,
  calculateWeightedAccessFactor,
  AccessDifficulty,
} from '@lt-offers/domain';
import { PrecipitationCalculator } from '@lt-offers/calc-engine';
import { ScheduleFacadeService } from '../contexts/schedule/application/services';

@Injectable()
export class FieldFactorsService {
  constructor(private readonly scheduleFacade: ScheduleFacadeService) {}

  getAccessWeights() {
    return ACCESS_SEVERITY_WEIGHTS;
  }

  getGeotechnicalFactors() {
    return DEFAULT_GEOTECHNICAL_FACTORS;
  }

  calculateWeightedAccess(
    distribution: { difficulty: AccessDifficulty; count: number }[],
  ) {
    return {
      weightedAccessFactor: calculateWeightedAccessFactor(distribution),
      distribution,
    };
  }

  // Parâmetros de chuva da versão vigente na data de referência (RNF-05),
  // resolvida na borda (controller) e recebida como data civil AAAA-MM-DD.
  async getAllPrecipitationUfs(
    referenceDate: string,
  ): Promise<PrecipitationUfData[]> {
    const { parameters } =
      await this.scheduleFacade.getEffectiveRainfallParameters(referenceDate);
    return PrecipitationCalculator.getAllUfData(parameters);
  }

  async getPrecipitationByUf(
    uf: string,
    referenceDate: string,
  ): Promise<PrecipitationUfData> {
    const { parameters } =
      await this.scheduleFacade.getEffectiveRainfallParameters(referenceDate);
    if (!PrecipitationCalculator.isKnownUf(uf, parameters)) {
      throw new NotFoundException(
        `UF '${uf}' não encontrada no catálogo de precipitação.`,
      );
    }
    return PrecipitationCalculator.getUfPrecipitationSeries(uf, parameters);
  }
}
