import { IpiRule } from '@lt-offers/domain';
import { UfStateTaxProfile } from '../entities/uf-state-tax-profile';

/**
 * Porta de consulta das tabelas tributárias brutas (UFs e catálogo de IPI
 * por NCM). A matriz de ICMS e a regra de PIS/COFINS são derivadas no
 * domínio, não fornecidas pelo adaptador.
 */
export interface TaxRulesQueryPort {
  findStates(): UfStateTaxProfile[];
  findIpiRules(): Record<string, IpiRule>;
}
