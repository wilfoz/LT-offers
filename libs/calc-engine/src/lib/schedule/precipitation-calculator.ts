import { DecimalValue } from '../decimal-value';
import {
  PrecipitationFactor,
  PrecipitationLevel,
  PrecipitationUfData,
  BrazilianRegion,
} from '@lt-offers/domain';

export interface UfMetadata {
  name: string;
  region: BrazilianRegion;
}

export const UF_METADATA_MAP: Record<string, UfMetadata> = {
  // Norte
  AC: { name: 'Acre', region: 'NORTE' },
  AP: { name: 'Amapá', region: 'NORTE' },
  AM: { name: 'Amazonas', region: 'NORTE' },
  PA: { name: 'Pará', region: 'NORTE' },
  RO: { name: 'Rondônia', region: 'NORTE' },
  RR: { name: 'Roraima', region: 'NORTE' },
  TO: { name: 'Tocantins', region: 'NORTE' },
  // Nordeste
  AL: { name: 'Alagoas', region: 'NORDESTE' },
  BA: { name: 'Bahia', region: 'NORDESTE' },
  CE: { name: 'Ceará', region: 'NORDESTE' },
  MA: { name: 'Maranhão', region: 'NORDESTE' },
  PB: { name: 'Paraíba', region: 'NORDESTE' },
  PE: { name: 'Pernambuco', region: 'NORDESTE' },
  PI: { name: 'Piauí', region: 'NORDESTE' },
  RN: { name: 'Rio Grande do Norte', region: 'NORDESTE' },
  SE: { name: 'Sergipe', region: 'NORDESTE' },
  // Centro-Oeste
  DF: { name: 'Distrito Federal', region: 'CENTRO_OESTE' },
  GO: { name: 'Goiás', region: 'CENTRO_OESTE' },
  MT: { name: 'Mato Grosso', region: 'CENTRO_OESTE' },
  MS: { name: 'Mato Grosso do Sul', region: 'CENTRO_OESTE' },
  // Sudeste
  ES: { name: 'Espírito Santo', region: 'SUDESTE' },
  MG: { name: 'Minas Gerais', region: 'SUDESTE' },
  RJ: { name: 'Rio de Janeiro', region: 'SUDESTE' },
  SP: { name: 'São Paulo', region: 'SUDESTE' },
  // Sul
  PR: { name: 'Paraná', region: 'SUL' },
  RS: { name: 'Rio Grande do Sul', region: 'SUL' },
  SC: { name: 'Santa Catarina', region: 'SUL' },
};

/**
 * Matriz padrão de precipitação pluviométrica histórica média (mm) por UF e mês (1=Jan a 12=Dez).
 * Fonte: INMET / Planilha Calculo LT (aba Precip, RN-16).
 */
const DEFAULT_PRECIPITATION_BY_UF: Record<string, number[]> = {
  // Sudeste
  MG: [280, 210, 160, 65, 30, 15, 10, 15, 50, 120, 210, 310],
  SP: [260, 220, 160, 80, 55, 45, 40, 35, 75, 130, 150, 220],
  RJ: [230, 190, 150, 95, 70, 50, 45, 40, 60, 110, 160, 240],
  ES: [210, 150, 140, 100, 60, 45, 45, 40, 70, 120, 220, 250],
  // Nordeste
  BA: [120, 110, 130, 115, 85, 75, 65, 45, 35, 55, 120, 135],
  CE: [110, 170, 215, 190, 105, 45, 25, 10, 5, 10, 15, 40],
  MA: [220, 280, 390, 350, 220, 90, 30, 15, 15, 30, 70, 130],
  PI: [190, 210, 270, 220, 95, 25, 10, 5, 5, 20, 65, 110],
  PE: [60, 75, 120, 140, 150, 130, 110, 65, 35, 20, 25, 40],
  RN: [65, 90, 170, 185, 120, 75, 50, 25, 15, 10, 15, 25],
  PB: [65, 80, 140, 155, 110, 75, 55, 30, 15, 10, 15, 30],
  AL: [75, 80, 125, 165, 190, 170, 140, 85, 45, 25, 30, 45],
  SE: [70, 75, 110, 160, 185, 160, 130, 80, 50, 30, 35, 50],
  // Centro-Oeste
  GO: [270, 215, 190, 85, 25, 10, 5, 10, 45, 140, 215, 270],
  MT: [280, 250, 220, 110, 40, 15, 5, 10, 45, 140, 210, 270],
  MS: [220, 180, 150, 95, 80, 55, 40, 35, 75, 130, 160, 210],
  DF: [260, 210, 180, 85, 25, 10, 5, 10, 45, 140, 210, 260],
  // Norte
  PA: [330, 380, 420, 360, 270, 140, 90, 55, 50, 75, 120, 210],
  TO: [260, 230, 250, 140, 40, 10, 5, 10, 40, 130, 210, 260],
  AM: [290, 310, 340, 300, 230, 120, 70, 55, 75, 125, 180, 240],
  RO: [310, 290, 280, 170, 70, 20, 10, 15, 65, 145, 210, 280],
  AC: [280, 270, 270, 180, 85, 35, 25, 30, 75, 140, 190, 250],
  RR: [75, 65, 90, 145, 270, 310, 280, 190, 95, 65, 65, 70],
  AP: [190, 280, 380, 410, 390, 240, 140, 55, 30, 35, 55, 110],
  // Sul
  PR: [200, 170, 140, 110, 115, 105, 95, 85, 130, 155, 140, 170],
  SC: [190, 175, 145, 115, 120, 110, 100, 105, 145, 160, 140, 165],
  RS: [150, 140, 130, 125, 130, 135, 130, 120, 155, 160, 135, 140],
};

const PRODUCTIVITY_FACTORS_BY_LEVEL: Record<PrecipitationLevel, string> = {
  1: '1.00', // < 50 mm (Seco)
  2: '0.95', // 50 - 100 mm (Baixa)
  3: '0.85', // 100 - 200 mm (Média)
  4: '0.75', // 200 - 300 mm (Alta)
  5: '0.65', // > 300 mm (Severa / Crítica)
};

export class PrecipitationCalculator {
  /**
   * Verifica se a UF é válida e coberta pelo catálogo.
   */
  static isKnownUf(uf: string): boolean {
    return !!DEFAULT_PRECIPITATION_BY_UF[uf.toUpperCase()];
  }

  /**
   * Lista todas as 27 UFs com dados completos de precipitação e região.
   */
  static getAllUfData(): PrecipitationUfData[] {
    return Object.keys(DEFAULT_PRECIPITATION_BY_UF).map((uf) =>
      this.getUfPrecipitationSeries(uf),
    );
  }

  /**
   * Retorna a série completa dos 12 meses para uma UF específica.
   */
  static getUfPrecipitationSeries(uf: string): PrecipitationUfData {
    const upperUf = uf.toUpperCase();
    const monthsData =
      DEFAULT_PRECIPITATION_BY_UF[upperUf] || DEFAULT_PRECIPITATION_BY_UF['MG'];
    const meta = UF_METADATA_MAP[upperUf] || {
      name: upperUf,
      region: 'SUDESTE' as const,
    };

    const monthlyData = monthsData.map((mm, index) => {
      const level = this.classifyLevel(mm);
      return {
        month: index + 1,
        averageMm: mm,
        severityLevel: level,
        productivityFactor: parseFloat(PRODUCTIVITY_FACTORS_BY_LEVEL[level]),
      };
    });

    return {
      uf: upperUf,
      name: meta.name,
      region: meta.region,
      monthlyData,
    };
  }

  /**
   * Classifica a severidade de precipitação em 5 níveis conforme RN-16.
   */
  static classifyLevel(precipitationMm: number | string): PrecipitationLevel {
    const val =
      typeof precipitationMm === 'number'
        ? precipitationMm
        : parseFloat(precipitationMm);
    if (val < 50) return 1;
    if (val <= 100) return 2;
    if (val <= 200) return 3;
    if (val <= 300) return 4;
    return 5;
  }

  /**
   * Retorna o fator multiplicador de produtividade para o nível pluviométrico.
   */
  static getProductivityFactor(level: PrecipitationLevel): DecimalValue {
    return DecimalValue.of(PRODUCTIVITY_FACTORS_BY_LEVEL[level]);
  }

  /**
   * Recupera o índice de precipitação e fator de produtividade para uma UF e mês (1 a 12).
   */
  static getPrecipitationForUfAndMonth(
    uf: string,
    month: number,
  ): PrecipitationFactor {
    const upperUf = uf.toUpperCase();
    const monthsData =
      DEFAULT_PRECIPITATION_BY_UF[upperUf] || DEFAULT_PRECIPITATION_BY_UF['MG'];
    const normalizedMonth = (((month - 1) % 12) + 12) % 12; // 0-indexed seguro
    const mm = monthsData[normalizedMonth];
    const level = this.classifyLevel(mm);
    const factor = PRODUCTIVITY_FACTORS_BY_LEVEL[level];

    return {
      uf: upperUf,
      month: normalizedMonth + 1,
      precipitationMm: mm.toFixed(2),
      level,
      productivityFactor: factor,
    };
  }

  /**
   * Calcula a produção efetiva da equipe ajustada pelo índice de chuva do mês (RF-37, RN-16).
   */
  static calculateEffectiveProduction(
    nominalProduction: string | number,
    uf: string,
    month: number,
  ): DecimalValue {
    const nominal = DecimalValue.of(nominalProduction);
    const precip = this.getPrecipitationForUfAndMonth(uf, month);
    const factor = DecimalValue.of(precip.productivityFactor);
    return nominal.times(factor).round(2, 'half-up');
  }

  /**
   * Retorna o fator de produtividade médio para um período de meses consecutivos a partir de um mês inicial.
   */
  static getAverageProductivityFactor(
    uf: string,
    startMonth: number,
    durationMonths: number,
  ): DecimalValue {
    if (durationMonths <= 0) return DecimalValue.of(1);

    let sum = DecimalValue.zero();
    for (let i = 0; i < durationMonths; i++) {
      const m = startMonth + i;
      const precip = this.getPrecipitationForUfAndMonth(uf, m);
      sum = sum.plus(DecimalValue.of(precip.productivityFactor));
    }

    return sum.dividedBy(DecimalValue.of(durationMonths)).round(4, 'half-up');
  }
}
