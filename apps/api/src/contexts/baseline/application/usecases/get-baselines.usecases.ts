import { Inject, Injectable } from '@nestjs/common';
import { WorkBaseline } from '@lt-offers/domain';
import {
  BASELINES_REPOSITORY_TOKEN,
  BaselineNotFoundException,
  BaselinesRepository,
  NoActiveBaselineException,
} from '../../domain';

@Injectable()
export class GetActiveBaselineUseCase {
  constructor(
    @Inject(BASELINES_REPOSITORY_TOKEN)
    private readonly baselines: BaselinesRepository,
  ) {}

  /**
   * Obtém a Linha de Base ativa de uma oferta; sem baseline própria, adapta
   * a baseline seed padrão (comportamento herdado do legado).
   */
  async execute(offerId: number): Promise<WorkBaseline> {
    const active = await this.baselines.findActiveByOfferId(offerId);
    if (active) {
      return active;
    }

    const seed = await this.baselines.findById(1);
    if (seed) {
      return { ...seed, offerId };
    }

    throw new NoActiveBaselineException(offerId);
  }
}

@Injectable()
export class GetBaselineByIdUseCase {
  constructor(
    @Inject(BASELINES_REPOSITORY_TOKEN)
    private readonly baselines: BaselinesRepository,
  ) {}

  async execute(id: number): Promise<WorkBaseline> {
    const baseline = await this.baselines.findById(id);
    if (!baseline) {
      throw new BaselineNotFoundException(id);
    }
    return baseline;
  }
}

@Injectable()
export class ListBaselinesUseCase {
  constructor(
    @Inject(BASELINES_REPOSITORY_TOKEN)
    private readonly baselines: BaselinesRepository,
    private readonly getActiveBaseline: GetActiveBaselineUseCase,
  ) {}

  async execute(offerId: number): Promise<WorkBaseline[]> {
    const list = await this.baselines.listByOfferId(offerId);
    if (list.length === 0) {
      list.push(await this.getActiveBaseline.execute(offerId));
    }
    return list;
  }
}
