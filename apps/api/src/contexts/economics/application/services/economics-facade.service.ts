import { Injectable } from '@nestjs/common';
import {
  CashflowSummary,
  EconomicResultSummary,
  SaleCoefficients,
} from '@lt-offers/domain';
import { CashflowQueryParams } from '../../domain';
import { GetLineEconomicResultUseCase } from '../usecases/get-line-economic-result.usecase';
import { GetConsolidatedEconomicResultUseCase } from '../usecases/get-consolidated-economic-result.usecase';
import { GetConsolidatedCashflowUseCase } from '../usecases/get-consolidated-cashflow.usecase';

/**
 * Facade de aplicação do contexto economics para consumo por outros
 * módulos (export e baseline). Superfície mínima: apenas o que os
 * consumidores atuais usam — métodos novos entram quando um consumidor
 * os exigir.
 */
@Injectable()
export class EconomicsFacadeService {
  constructor(
    private readonly getLineEconomicResultUseCase: GetLineEconomicResultUseCase,
    private readonly getConsolidatedEconomicResultUseCase: GetConsolidatedEconomicResultUseCase,
    private readonly getConsolidatedCashflowUseCase: GetConsolidatedCashflowUseCase,
  ) {}

  async getLineEconomicResult(
    lineId: number,
    customCoeffs?: Partial<SaleCoefficients>,
  ): Promise<EconomicResultSummary> {
    return this.getLineEconomicResultUseCase.execute(lineId, customCoeffs);
  }

  async getConsolidatedEconomicResult(
    offerId: number,
    customCoeffs?: Partial<SaleCoefficients>,
  ): Promise<EconomicResultSummary> {
    return this.getConsolidatedEconomicResultUseCase.execute(
      offerId,
      customCoeffs,
    );
  }

  async getConsolidatedCashflow(
    offerId: number,
    params?: CashflowQueryParams,
  ): Promise<CashflowSummary> {
    return this.getConsolidatedCashflowUseCase.execute(offerId, params);
  }
}
