import {
  StakingCheckData,
  MaterialCheckData,
  ScheduleCheckData,
  HistogramCheckData,
  ServiceCheckData,
  CashflowCheckData,
} from '@lt-offers/calc-engine';

export type {
  StakingCheckData,
  MaterialCheckData,
  ScheduleCheckData,
  HistogramCheckData,
  ServiceCheckData,
  CashflowCheckData,
};

/**
 * Porta de consulta transversal para alimentação do motor de consistência (RF-62, RF-63, RNF-09).
 * Define um método por bloco de dados da oferta consumido pelo ConsistencyEngine.
 */
export interface ChecksDataQueryPort {
  checkOfferExists(offerId: string): Promise<boolean>;
  getStakingData(offerId: string): Promise<StakingCheckData[]>;
  getMaterialsData(offerId: string): Promise<MaterialCheckData[]>;
  getScheduleData(offerId: string): Promise<ScheduleCheckData[]>;
  getHistogramData(offerId: string): Promise<HistogramCheckData[]>;
  getServicesData(offerId: string): Promise<ServiceCheckData[]>;
  getCashflowData(offerId: string): Promise<CashflowCheckData | undefined>;
}
