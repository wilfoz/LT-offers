import { Injectable } from '@nestjs/common';
import { IcmsRule, IpiRule, PisCofinsRule } from '@lt-offers/domain';

@Injectable()
export class TaxTablesService {
  /**
   * Estados da Federação e alíquotas internas padrão + FECOEP.
   */
  private readonly statesData: Record<
    string,
    { name: string; internalRate: number; fecoepRate: number; difalMethod: 'SINGLE_BASE' | 'DOUBLE_BASE' }
  > = {
    AC: { name: 'Acre', internalRate: 19.0, fecoepRate: 0.0, difalMethod: 'SINGLE_BASE' },
    AL: { name: 'Alagoas', internalRate: 19.0, fecoepRate: 1.0, difalMethod: 'DOUBLE_BASE' },
    AP: { name: 'Amapá', internalRate: 18.0, fecoepRate: 0.0, difalMethod: 'SINGLE_BASE' },
    AM: { name: 'Amazonas', internalRate: 20.0, fecoepRate: 0.0, difalMethod: 'SINGLE_BASE' },
    BA: { name: 'Bahia', internalRate: 19.0, fecoepRate: 1.0, difalMethod: 'DOUBLE_BASE' },
    CE: { name: 'Ceará', internalRate: 20.0, fecoepRate: 0.0, difalMethod: 'DOUBLE_BASE' },
    DF: { name: 'Distrito Federal', internalRate: 18.0, fecoepRate: 0.0, difalMethod: 'SINGLE_BASE' },
    ES: { name: 'Espírito Santo', internalRate: 17.0, fecoepRate: 0.0, difalMethod: 'SINGLE_BASE' },
    GO: { name: 'Goiás', internalRate: 19.0, fecoepRate: 0.0, difalMethod: 'DOUBLE_BASE' },
    MA: { name: 'Maranhão', internalRate: 22.0, fecoepRate: 0.0, difalMethod: 'DOUBLE_BASE' },
    MT: { name: 'Mato Grosso', internalRate: 17.0, fecoepRate: 0.0, difalMethod: 'SINGLE_BASE' },
    MS: { name: 'Mato Grosso do Sul', internalRate: 17.0, fecoepRate: 0.0, difalMethod: 'SINGLE_BASE' },
    MG: { name: 'Minas Gerais', internalRate: 18.0, fecoepRate: 2.0, difalMethod: 'DOUBLE_BASE' },
    PA: { name: 'Pará', internalRate: 19.0, fecoepRate: 0.0, difalMethod: 'SINGLE_BASE' },
    PB: { name: 'Paraíba', internalRate: 18.0, fecoepRate: 2.0, difalMethod: 'DOUBLE_BASE' },
    PR: { name: 'Paraná', internalRate: 19.5, fecoepRate: 0.0, difalMethod: 'DOUBLE_BASE' },
    PE: { name: 'Pernambuco', internalRate: 20.5, fecoepRate: 0.0, difalMethod: 'DOUBLE_BASE' },
    PI: { name: 'Piauí', internalRate: 21.0, fecoepRate: 1.0, difalMethod: 'DOUBLE_BASE' },
    RJ: { name: 'Rio de Janeiro', internalRate: 20.0, fecoepRate: 2.0, difalMethod: 'DOUBLE_BASE' },
    RN: { name: 'Rio Grande do Norte', internalRate: 18.0, fecoepRate: 2.0, difalMethod: 'DOUBLE_BASE' },
    RS: { name: 'Rio Grande do Sul', internalRate: 17.0, fecoepRate: 0.0, difalMethod: 'DOUBLE_BASE' },
    RO: { name: 'Rondônia', internalRate: 17.5, fecoepRate: 0.0, difalMethod: 'SINGLE_BASE' },
    RR: { name: 'Roraima', internalRate: 20.0, fecoepRate: 0.0, difalMethod: 'SINGLE_BASE' },
    SC: { name: 'Santa Catarina', internalRate: 17.0, fecoepRate: 0.0, difalMethod: 'SINGLE_BASE' },
    SP: { name: 'São Paulo', internalRate: 18.0, fecoepRate: 0.0, difalMethod: 'SINGLE_BASE' },
    SE: { name: 'Sergipe', internalRate: 19.0, fecoepRate: 1.0, difalMethod: 'DOUBLE_BASE' },
    TO: { name: 'Tocantins', internalRate: 20.0, fecoepRate: 0.0, difalMethod: 'SINGLE_BASE' },
  };

  /**
   * Catálogo de IPI por NCM de materiais de LT (RN-06).
   */
  private readonly ipiCatalog: Record<string, IpiRule> = {
    '7308.20.00': {
      ncmCode: '7308.20.00',
      description: 'Torres e pórticos de ferro ou aço',
      ratePercent: 3.25,
    },
    '7614.10.10': {
      ncmCode: '7614.10.10',
      description: 'Cabos de alumínio com alma de aço (CAA/ACSR)',
      ratePercent: 0.0,
    },
    '7614.90.10': {
      ncmCode: '7614.90.10',
      description: 'Cabos de liga de alumínio (CAL/AAAC)',
      ratePercent: 0.0,
    },
    '7312.10.90': {
      ncmCode: '7312.10.90',
      description: 'Cabos de aço para estais e tirantes',
      ratePercent: 3.25,
    },
    '8546.10.00': {
      ncmCode: '8546.10.00',
      description: 'Isoladores elétricos de vidro',
      ratePercent: 6.5,
    },
    '8546.20.00': {
      ncmCode: '8546.20.00',
      description: 'Isoladores elétricos de cerâmica / porcelana',
      ratePercent: 6.5,
    },
    '8546.90.00': {
      ncmCode: '8546.90.00',
      description: 'Isoladores poliméricos compostos',
      ratePercent: 6.5,
    },
    '7326.90.90': {
      ncmCode: '7326.90.90',
      description: 'Ferragens e grampos de suspensão e ancoragem',
      ratePercent: 5.0,
    },
    '8544.70.10': {
      ncmCode: '8544.70.10',
      description: 'Cabos de fibra óptica tipo OPGW',
      ratePercent: 0.0,
    },
  };

  /**
   * Retorna os estados cadastrados.
   */
  getStates() {
    return Object.entries(this.statesData).map(([code, data]) => ({
      code,
      name: data.name,
      internalRate: data.internalRate,
      fecoepRate: data.fecoepRate,
      difalMethod: data.difalMethod,
    }));
  }

  /**
   * Constrói e retorna o mapa completo de regras de ICMS interestadual.
   */
  getIcmsRulesMap(): Record<string, IcmsRule> {
    const rules: Record<string, IcmsRule> = {};
    const states = Object.keys(this.statesData);

    const southSoutheastOrigins = ['SP', 'RJ', 'MG', 'PR', 'SC', 'RS'];

    for (const origin of states) {
      for (const dest of states) {
        const key = `${origin}->${dest}`;
        const isInternal = origin === dest;
        const destData = this.statesData[dest];

        let interstateRate = 12.0;
        if (isInternal) {
          interstateRate = destData.internalRate;
        } else if (
          southSoutheastOrigins.includes(origin) &&
          !southSoutheastOrigins.includes(dest)
        ) {
          // Sul e Sudeste (exceto ES) para Norte, Nordeste, Centro-Oeste e ES = 7%
          interstateRate = 7.0;
        } else {
          interstateRate = 12.0;
        }

        rules[key] = {
          originState: origin,
          destinationState: dest,
          interstateRatePercent: interstateRate,
          internalDestinationRatePercent: destData.internalRate,
          fecoepRatePercent: destData.fecoepRate,
          difalMethod: destData.difalMethod,
        };
      }
    }

    return rules;
  }

  /**
   * Retorna o mapa de regras de IPI por NCM.
   */
  getIpiRulesMap(): Record<string, IpiRule> {
    return { ...this.ipiCatalog };
  }

  /**
   * Retorna a regra padrão de PIS/COFINS por regime.
   */
  getPisCofinsRule(regime: 'STANDARD' | 'REIDI' | 'DIRECT_BILLING'): PisCofinsRule {
    if (regime === 'REIDI' || regime === 'DIRECT_BILLING') {
      return {
        regime,
        pisRatePercent: 0.0,
        cofinsRatePercent: 0.0,
      };
    }
    return {
      regime: 'STANDARD',
      pisRatePercent: 1.65,
      cofinsRatePercent: 7.6,
    };
  }
}
