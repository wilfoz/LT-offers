import {
  ContractChangeOrder,
  MonthlyProgressRecord,
  WorkBaseline,
} from '@lt-offers/domain';

/**
 * Repositório de linhas de base. Sem update/delete de propósito: a baseline
 * congelada é imutável por ausência estrutural do caminho de escrita
 * (design, decisão 5) — a estimativa corrente é derivada, nunca gravada.
 */
export interface BaselinesRepository {
  findActiveByOfferId(offerId: number): Promise<WorkBaseline | null>;
  findById(id: number): Promise<WorkBaseline | null>;
  listByOfferId(offerId: number): Promise<WorkBaseline[]>;
  /** Persiste a baseline recém-congelada atribuindo o próximo ID. */
  create(baseline: Omit<WorkBaseline, 'id'>): Promise<WorkBaseline>;
}

export interface ChangeOrdersRepository {
  listByBaselineId(baselineId: number): Promise<ContractChangeOrder[]>;
  findInBaseline(
    baselineId: number,
    changeOrderId: number,
  ): Promise<ContractChangeOrder | null>;
  /**
   * Anexa a ordem à baseline atribuindo o próximo ID global; sem código
   * informado, aplica o padrão do legado `AD-<id com 2 dígitos>`.
   */
  create(
    order: Omit<ContractChangeOrder, 'id' | 'code'> & { code?: string },
  ): Promise<ContractChangeOrder>;
  save(order: ContractChangeOrder): Promise<ContractChangeOrder>;
}

export interface ProgressRecordsRepository {
  listByBaselineId(baselineId: number): Promise<MonthlyProgressRecord[]>;
  /** Substitui o registro do mesmo mês ou insere, mantendo ordenação por mês. */
  upsertByMonth(record: MonthlyProgressRecord): Promise<MonthlyProgressRecord>;
}
