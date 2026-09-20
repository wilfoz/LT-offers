import { IcmsRule } from '@lt-offers/domain';

/**
 * Perfil tributário de uma UF: alíquota interna, FECOEP e método de DIFAL.
 */
export interface UfStateTaxProfile {
  code: string;
  name: string;
  internalRate: number;
  fecoepRate: number;
  difalMethod: IcmsRule['difalMethod'];
}
