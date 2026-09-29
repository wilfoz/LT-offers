import { ViabilityParametersVersionItem } from '@lt-offers/domain';
import { NoEffectiveViabilityParametersException } from '../../domain/exceptions/viability.exceptions';
import { ViabilityParametersRepository } from '../../domain/ports/viability-parameters.repository';

/** Versão vigente dos parâmetros pela data de referência (borda — D2). */
export class GetEffectiveViabilityParametersUseCase {
  constructor(private readonly repository: ViabilityParametersRepository) {}

  async execute(
    referenceDate: string,
  ): Promise<ViabilityParametersVersionItem> {
    const effective = await this.repository.findEffective(referenceDate);
    if (!effective) {
      throw new NoEffectiveViabilityParametersException(referenceDate);
    }
    return effective;
  }
}
