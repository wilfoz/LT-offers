import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ACCESS_SEVERITY_WEIGHTS,
  DEFAULT_GEOTECHNICAL_FACTORS,
  PrecipitationUfData,
  calculateWeightedAccessFactor,
  AccessDifficulty,
} from '@lt-offers/domain';
import { PrecipitationCalculator } from '@lt-offers/calc-engine';

@Injectable()
export class FieldFactorsService {
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

  getAllPrecipitationUfs(): PrecipitationUfData[] {
    return PrecipitationCalculator.getAllUfData();
  }

  getPrecipitationByUf(uf: string): PrecipitationUfData {
    if (!PrecipitationCalculator.isKnownUf(uf)) {
      throw new NotFoundException(
        `UF '${uf}' não encontrada no catálogo de precipitação.`,
      );
    }
    return PrecipitationCalculator.getUfPrecipitationSeries(uf);
  }
}
