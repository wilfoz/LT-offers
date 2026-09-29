import {
  ViabilityParameters,
  ViabilityParametersVersionItem,
} from '@lt-offers/domain';
import { ViabilityParametersRepository } from '../../domain/ports/viability-parameters.repository';

/** Cria uma nova versão dos parâmetros (versões anteriores imutáveis — RNF-05). */
export class CreateViabilityParametersVersionUseCase {
  constructor(private readonly repository: ViabilityParametersRepository) {}

  async execute(
    version: ViabilityParameters,
    createdBy: string,
  ): Promise<ViabilityParametersVersionItem> {
    return this.repository.create({ ...version, createdBy });
  }
}
