import { Inject, Injectable } from '@nestjs/common';
import { MaterialQuote } from '@lt-offers/domain';
import { QUOTES_QUERY_PORT_TOKEN, QuotesQueryPort } from '../../domain';

@Injectable()
export class GetQuotesUseCase {
  constructor(
    @Inject(QUOTES_QUERY_PORT_TOKEN)
    private readonly quotesQuery: QuotesQueryPort,
  ) {}

  /**
   * Retorna a lista de cotações de materiais cadastradas.
   */
  execute(): MaterialQuote[] {
    return Object.values(this.quotesQuery.findQuotesMap());
  }
}
