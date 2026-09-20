import { RiskItem } from '../entities';

/**
 * Porta de persistência para agregação de itens da Matriz de Riscos.
 */
export interface RisksRepository {
  findByOffer(offerId: string, lineId?: string): Promise<RiskItem[]>;
  findById(offerId: string, riskId: string): Promise<RiskItem | null>;
  save(offerId: string, risk: RiskItem): Promise<void>;
  delete(offerId: string, riskId: string): Promise<void>;
}
