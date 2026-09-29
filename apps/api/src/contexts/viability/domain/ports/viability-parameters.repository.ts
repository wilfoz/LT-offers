import {
  ViabilityParameters,
  ViabilityParametersVersionItem,
} from '@lt-offers/domain';

/**
 * Repositório do catálogo singleton de parâmetros de viabilidade (RNF-05):
 * versões imutáveis, vigente = maior effectiveFrom ≤ data de referência.
 */
export interface ViabilityParametersRepository {
  findEffective(
    referenceDate: string,
  ): Promise<ViabilityParametersVersionItem | null>;
  create(
    version: ViabilityParameters & { createdBy: string },
  ): Promise<ViabilityParametersVersionItem>;
}
