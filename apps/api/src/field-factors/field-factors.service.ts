import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ACCESS_SEVERITY_WEIGHTS,
  DEFAULT_GEOTECHNICAL_FACTORS,
  DEFAULT_RAINFALL_PARAMETERS,
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

  // Defaults da domain (idênticos ao seed) até a resolução da versão vigente
  // por data de referência migrar para o banco (task 4.3 desta change).
  getAllPrecipitationUfs(): PrecipitationUfData[] {
    return PrecipitationCalculator.getAllUfData(DEFAULT_RAINFALL_PARAMETERS);
  }

  getPrecipitationByUf(uf: string): PrecipitationUfData {
    if (!PrecipitationCalculator.isKnownUf(uf, DEFAULT_RAINFALL_PARAMETERS)) {
      throw new NotFoundException(
        `UF '${uf}' não encontrada no catálogo de precipitação.`,
      );
    }
    return PrecipitationCalculator.getUfPrecipitationSeries(
      uf,
      DEFAULT_RAINFALL_PARAMETERS,
    );
  }
}
