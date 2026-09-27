import { Inject, Injectable } from '@nestjs/common';
import {
  RainfallParameters,
  validateRainfallParameters,
} from '@lt-offers/domain';
import {
  InvalidScheduleParametersException,
  NoEffectiveScheduleParametersException,
  RainfallParametersVersionRecord,
  ScheduleParametersPort,
  SCHEDULE_PARAMETERS_PORT_TOKEN,
} from '../../domain';
import { rainfallViolationMessage } from './schedule-parameters-messages';

/** Resolve a versão de parâmetros de chuva vigente na data de referência. */
@Injectable()
export class GetEffectiveRainfallParametersUseCase {
  constructor(
    @Inject(SCHEDULE_PARAMETERS_PORT_TOKEN)
    private readonly parametersPort: ScheduleParametersPort,
  ) {}

  async execute(
    referenceDate: string,
  ): Promise<RainfallParametersVersionRecord> {
    const record =
      await this.parametersPort.findEffectiveRainfall(referenceDate);
    if (!record) {
      throw new NoEffectiveScheduleParametersException('chuva', referenceDate);
    }
    return record;
  }
}

/** Cria uma nova versão dos parâmetros de chuva (histórico imutável, RNF-05). */
@Injectable()
export class CreateRainfallParametersVersionUseCase {
  constructor(
    @Inject(SCHEDULE_PARAMETERS_PORT_TOKEN)
    private readonly parametersPort: ScheduleParametersPort,
  ) {}

  async execute(input: {
    effectiveFrom: string;
    createdBy: string;
    parameters: RainfallParameters;
  }): Promise<RainfallParametersVersionRecord> {
    const violations = validateRainfallParameters(input.parameters);
    if (violations.length > 0) {
      throw new InvalidScheduleParametersException(
        violations.map(rainfallViolationMessage),
      );
    }
    return this.parametersPort.createRainfallVersion(input);
  }
}
