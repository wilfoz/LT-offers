import { DecimalValue } from '../decimal-value';
import {
  PrecipitationFactor,
  PrecipitationUfData,
  RainfallParameters,
  RainfallSeverityBandContract,
  UF_METADATA_MAP,
  UfMetadata,
  classifyRainfallBand,
} from '@lt-offers/domain';

/**
 * Redutor de produtividade por precipitação pluviométrica (RF-37, RN-16).
 * Os parâmetros (matriz UF×mês, faixas e fatores) são dados configuráveis
 * vigentes resolvidos na borda e recebidos como entrada — o motor não possui
 * constantes internas nem fallback (design D2, RNF-04/RNF-09/RNF-16).
 */
export class PrecipitationCalculator {
  /**
   * Verifica se a UF está coberta pela matriz vigente.
   */
  static isKnownUf(uf: string, params: RainfallParameters): boolean {
    const upperUf = uf.toUpperCase();
    return params.ufSeries.some((series) => series.uf === upperUf);
  }

  /**
   * Lista todas as UFs da matriz vigente com séries completas e região.
   */
  static getAllUfData(params: RainfallParameters): PrecipitationUfData[] {
    return params.ufSeries.map((series) =>
      this.getUfPrecipitationSeries(series.uf, params),
    );
  }

  /**
   * Retorna a série completa dos 12 meses para uma UF específica.
   * UF fora da matriz é erro explícito, nunca fallback silencioso (RNF-09).
   */
  static getUfPrecipitationSeries(
    uf: string,
    params: RainfallParameters,
  ): PrecipitationUfData {
    const upperUf = uf.toUpperCase();
    const series = params.ufSeries.find((s) => s.uf === upperUf);
    if (!series) {
      throw new Error(
        `UF '${upperUf}' não encontrada na matriz de precipitação vigente.`,
      );
    }
    const meta: UfMetadata | undefined =
      UF_METADATA_MAP[upperUf as keyof typeof UF_METADATA_MAP];
    if (!meta) {
      throw new Error(
        `UF '${upperUf}' sem metadados de nome e região cadastrados.`,
      );
    }

    const monthlyData = series.monthlyMm.map((mm, index) => {
      const band = classifyRainfallBand(Number(mm), params.bands);
      return {
        month: index + 1,
        averageMm: Number(mm),
        severityLevel: band.position,
        productivityFactor: Number(band.productivityFactor),
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
   * Classifica a precipitação na faixa de severidade vigente (RN-16).
   */
  static classifyBand(
    precipitationMm: number | string,
    params: RainfallParameters,
  ): RainfallSeverityBandContract {
    return classifyRainfallBand(Number(precipitationMm), params.bands);
  }

  /**
   * Retorna o fator multiplicador de produtividade da faixa pela posição.
   */
  static getProductivityFactor(
    position: number,
    params: RainfallParameters,
  ): DecimalValue {
    const band = params.bands.find((b) => b.position === position);
    if (!band) {
      throw new Error(
        `Faixa de severidade de posição ${position} não existe nos parâmetros de chuva vigentes.`,
      );
    }
    return DecimalValue.of(band.productivityFactor);
  }

  /**
   * Recupera o índice de precipitação e fator de produtividade para uma UF e mês (1 a 12).
   */
  static getPrecipitationForUfAndMonth(
    uf: string,
    month: number,
    params: RainfallParameters,
  ): PrecipitationFactor {
    const upperUf = uf.toUpperCase();
    const series = params.ufSeries.find((s) => s.uf === upperUf);
    if (!series) {
      throw new Error(
        `UF '${upperUf}' não encontrada na matriz de precipitação vigente.`,
      );
    }
    const normalizedMonth = (((month - 1) % 12) + 12) % 12; // 0-indexed seguro
    const mm = series.monthlyMm[normalizedMonth];
    const band = classifyRainfallBand(Number(mm), params.bands);

    return {
      uf: upperUf,
      month: normalizedMonth + 1,
      precipitationMm: Number(mm).toFixed(2),
      level: band.position,
      productivityFactor: band.productivityFactor,
    };
  }

  /**
   * Calcula a produção efetiva da equipe ajustada pelo índice de chuva do mês (RF-37, RN-16).
   */
  static calculateEffectiveProduction(
    nominalProduction: string | number,
    uf: string,
    month: number,
    params: RainfallParameters,
  ): DecimalValue {
    const nominal = DecimalValue.of(nominalProduction);
    const precip = this.getPrecipitationForUfAndMonth(uf, month, params);
    const factor = DecimalValue.of(precip.productivityFactor);
    return nominal.times(factor).round(2, 'half-up');
  }

  /**
   * Fator de produtividade médio para meses consecutivos a partir de um mês
   * inicial — método legado de estimativa de duração, mantido para os testes
   * golden que quantificam o desvio do consumo mês a mês.
   */
  static getAverageProductivityFactor(
    uf: string,
    startMonth: number,
    durationMonths: number,
    params: RainfallParameters,
  ): DecimalValue {
    if (durationMonths <= 0) return DecimalValue.of(1);

    let sum = DecimalValue.zero();
    for (let i = 0; i < durationMonths; i++) {
      const m = startMonth + i;
      const precip = this.getPrecipitationForUfAndMonth(uf, m, params);
      sum = sum.plus(DecimalValue.of(precip.productivityFactor));
    }

    return sum.dividedBy(DecimalValue.of(durationMonths)).round(4, 'half-up');
  }
}
