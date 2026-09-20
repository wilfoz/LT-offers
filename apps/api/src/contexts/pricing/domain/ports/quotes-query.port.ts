import { MaterialQuote } from '@lt-offers/domain';

/**
 * Porta de consulta das cotações de materiais, indexadas por código.
 */
export interface QuotesQueryPort {
  findQuotesMap(): Record<string, MaterialQuote>;
}
