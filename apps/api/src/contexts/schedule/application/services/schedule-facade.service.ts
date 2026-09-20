import { Injectable } from '@nestjs/common';
import { LineSchedule, CampPlan } from '../../domain';
import { GetLineScheduleUseCase } from '../usecases/get-line-schedule.usecase';
import { GetLineCampsUseCase } from '../usecases/get-line-camps.usecase';

/**
 * Fachada de aplicação do contexto de cronograma e canteiros para consumo por outros contextos (ex.: histogram).
 */
@Injectable()
export class ScheduleFacadeService {
  constructor(
    private readonly getLineScheduleUseCase: GetLineScheduleUseCase,
    private readonly getLineCampsUseCase: GetLineCampsUseCase,
  ) {}

  async getLineSchedule(lineId: number): Promise<LineSchedule> {
    return this.getLineScheduleUseCase.execute(lineId);
  }

  async getLineCamps(lineId: number): Promise<CampPlan> {
    return this.getLineCampsUseCase.execute(lineId);
  }
}
