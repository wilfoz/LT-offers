import { Inject, Injectable } from '@nestjs/common';
import {
  WorkCalendarParameters,
  validateWorkCalendar,
} from '@lt-offers/domain';
import {
  InvalidScheduleParametersException,
  NoEffectiveScheduleParametersException,
  ScheduleParametersPort,
  SCHEDULE_PARAMETERS_PORT_TOKEN,
  WorkCalendarVersionRecord,
} from '../../domain';
import { workCalendarViolationMessage } from './schedule-parameters-messages';

/** Resolve a versão do calendário de trabalho vigente na data de referência. */
@Injectable()
export class GetEffectiveWorkCalendarUseCase {
  constructor(
    @Inject(SCHEDULE_PARAMETERS_PORT_TOKEN)
    private readonly parametersPort: ScheduleParametersPort,
  ) {}

  async execute(referenceDate: string): Promise<WorkCalendarVersionRecord> {
    const record =
      await this.parametersPort.findEffectiveWorkCalendar(referenceDate);
    if (!record) {
      throw new NoEffectiveScheduleParametersException(
        'calendário',
        referenceDate,
      );
    }
    return record;
  }
}

/** Cria uma nova versão do calendário de trabalho (histórico imutável, RNF-05). */
@Injectable()
export class CreateWorkCalendarVersionUseCase {
  constructor(
    @Inject(SCHEDULE_PARAMETERS_PORT_TOKEN)
    private readonly parametersPort: ScheduleParametersPort,
  ) {}

  async execute(input: {
    effectiveFrom: string;
    createdBy: string;
    calendar: WorkCalendarParameters;
  }): Promise<WorkCalendarVersionRecord> {
    const violations = validateWorkCalendar(input.calendar);
    if (violations.length > 0) {
      throw new InvalidScheduleParametersException(
        violations.map(workCalendarViolationMessage),
      );
    }
    return this.parametersPort.createWorkCalendarVersion(input);
  }
}
