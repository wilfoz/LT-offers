import { POSITIVE_DECIMAL_PATTERN } from '../catalogs/validation';
import { BrazilianRegion } from '../field-factors/field-factors.types';

/**
 * Contratos do catálogo versionado de parâmetros de chuva (RN-16, RF-37).
 * Matriz de precipitação, faixas de severidade e fatores de produtividade são
 * dados configuráveis pelo usuário (RNF-05); valores numéricos trafegam como
 * string decimal (RNF-08).
 */

/** Ordem canônica das 27 UFs brasileiras cobertas pela matriz (RN-16). */
export const BRAZILIAN_UFS = [
  'AC',
  'AL',
  'AM',
  'AP',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MG',
  'MS',
  'MT',
  'PA',
  'PB',
  'PE',
  'PI',
  'PR',
  'RJ',
  'RN',
  'RO',
  'RR',
  'RS',
  'SC',
  'SE',
  'SP',
  'TO',
] as const;

export type BrazilianUf = (typeof BRAZILIAN_UFS)[number];

export interface UfMetadata {
  name: string;
  region: BrazilianRegion;
}

/** Nome e região de cada UF — metadado estático, não configurável. */
export const UF_METADATA_MAP: Record<BrazilianUf, UfMetadata> = {
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
 * Faixa de severidade de precipitação. A faixa aplica-se enquanto a
 * precipitação for menor ou igual ao limite superior (inclusivo); a última
 * faixa é aberta (upperLimitMm nulo = sem limite superior).
 */
export interface RainfallSeverityBandContract {
  /** Posição ordinal da faixa (1 = menos severa). */
  position: number;
  /** Limite superior inclusivo em mm/mês; null apenas na última faixa. */
  upperLimitMm: string | null;
  /** Fator multiplicador de produtividade entre 0 e 1 (RNF-08). */
  productivityFactor: string;
}

/** Série de precipitação média histórica de uma UF (índice 0 = janeiro). */
export interface RainfallUfSeriesContract {
  uf: string;
  /** 12 valores em mm, um por mês do calendário. */
  monthlyMm: string[];
}

/** Conjunto completo de parâmetros de chuva vigente em uma data. */
export interface RainfallParameters {
  bands: RainfallSeverityBandContract[];
  ufSeries: RainfallUfSeriesContract[];
}

/**
 * Faixas default extraídas da planilha Calculo LT (RN-16 — hipótese, §02).
 * Limites inclusivos: a 1ª faixa termina em 49,9 mm para reproduzir a
 * classificação histórica "< 50 mm = seco" na escala de 1 casa decimal.
 */
export const DEFAULT_RAINFALL_SEVERITY_BANDS: RainfallSeverityBandContract[] = [
  { position: 1, upperLimitMm: '49.9', productivityFactor: '1.00' },
  { position: 2, upperLimitMm: '100', productivityFactor: '0.95' },
  { position: 3, upperLimitMm: '200', productivityFactor: '0.85' },
  { position: 4, upperLimitMm: '300', productivityFactor: '0.75' },
  { position: 5, upperLimitMm: null, productivityFactor: '0.65' },
];

/**
 * Matriz default de precipitação média histórica (mm) por UF e mês
 * (índice 0 = janeiro). Fonte: INMET / planilha Calculo LT, aba Precip (RN-16).
 */
export const DEFAULT_PRECIPITATION_MM_BY_UF: Record<BrazilianUf, string[]> = {
  // Sudeste
  MG: [
    '280',
    '210',
    '160',
    '65',
    '30',
    '15',
    '10',
    '15',
    '50',
    '120',
    '210',
    '310',
  ],
  SP: [
    '260',
    '220',
    '160',
    '80',
    '55',
    '45',
    '40',
    '35',
    '75',
    '130',
    '150',
    '220',
  ],
  RJ: [
    '230',
    '190',
    '150',
    '95',
    '70',
    '50',
    '45',
    '40',
    '60',
    '110',
    '160',
    '240',
  ],
  ES: [
    '210',
    '150',
    '140',
    '100',
    '60',
    '45',
    '45',
    '40',
    '70',
    '120',
    '220',
    '250',
  ],
  // Nordeste
  BA: [
    '120',
    '110',
    '130',
    '115',
    '85',
    '75',
    '65',
    '45',
    '35',
    '55',
    '120',
    '135',
  ],
  CE: [
    '110',
    '170',
    '215',
    '190',
    '105',
    '45',
    '25',
    '10',
    '5',
    '10',
    '15',
    '40',
  ],
  MA: [
    '220',
    '280',
    '390',
    '350',
    '220',
    '90',
    '30',
    '15',
    '15',
    '30',
    '70',
    '130',
  ],
  PI: [
    '190',
    '210',
    '270',
    '220',
    '95',
    '25',
    '10',
    '5',
    '5',
    '20',
    '65',
    '110',
  ],
  PE: [
    '60',
    '75',
    '120',
    '140',
    '150',
    '130',
    '110',
    '65',
    '35',
    '20',
    '25',
    '40',
  ],
  RN: [
    '65',
    '90',
    '170',
    '185',
    '120',
    '75',
    '50',
    '25',
    '15',
    '10',
    '15',
    '25',
  ],
  PB: [
    '65',
    '80',
    '140',
    '155',
    '110',
    '75',
    '55',
    '30',
    '15',
    '10',
    '15',
    '30',
  ],
  AL: [
    '75',
    '80',
    '125',
    '165',
    '190',
    '170',
    '140',
    '85',
    '45',
    '25',
    '30',
    '45',
  ],
  SE: [
    '70',
    '75',
    '110',
    '160',
    '185',
    '160',
    '130',
    '80',
    '50',
    '30',
    '35',
    '50',
  ],
  // Centro-Oeste
  GO: [
    '270',
    '215',
    '190',
    '85',
    '25',
    '10',
    '5',
    '10',
    '45',
    '140',
    '215',
    '270',
  ],
  MT: [
    '280',
    '250',
    '220',
    '110',
    '40',
    '15',
    '5',
    '10',
    '45',
    '140',
    '210',
    '270',
  ],
  MS: [
    '220',
    '180',
    '150',
    '95',
    '80',
    '55',
    '40',
    '35',
    '75',
    '130',
    '160',
    '210',
  ],
  DF: [
    '260',
    '210',
    '180',
    '85',
    '25',
    '10',
    '5',
    '10',
    '45',
    '140',
    '210',
    '260',
  ],
  // Norte
  PA: [
    '330',
    '380',
    '420',
    '360',
    '270',
    '140',
    '90',
    '55',
    '50',
    '75',
    '120',
    '210',
  ],
  TO: [
    '260',
    '230',
    '250',
    '140',
    '40',
    '10',
    '5',
    '10',
    '40',
    '130',
    '210',
    '260',
  ],
  AM: [
    '290',
    '310',
    '340',
    '300',
    '230',
    '120',
    '70',
    '55',
    '75',
    '125',
    '180',
    '240',
  ],
  RO: [
    '310',
    '290',
    '280',
    '170',
    '70',
    '20',
    '10',
    '15',
    '65',
    '145',
    '210',
    '280',
  ],
  AC: [
    '280',
    '270',
    '270',
    '180',
    '85',
    '35',
    '25',
    '30',
    '75',
    '140',
    '190',
    '250',
  ],
  RR: [
    '75',
    '65',
    '90',
    '145',
    '270',
    '310',
    '280',
    '190',
    '95',
    '65',
    '65',
    '70',
  ],
  AP: [
    '190',
    '280',
    '380',
    '410',
    '390',
    '240',
    '140',
    '55',
    '30',
    '35',
    '55',
    '110',
  ],
  // Sul
  PR: [
    '200',
    '170',
    '140',
    '110',
    '115',
    '105',
    '95',
    '85',
    '130',
    '155',
    '140',
    '170',
  ],
  SC: [
    '190',
    '175',
    '145',
    '115',
    '120',
    '110',
    '100',
    '105',
    '145',
    '160',
    '140',
    '165',
  ],
  RS: [
    '150',
    '140',
    '130',
    '125',
    '130',
    '135',
    '130',
    '120',
    '155',
    '160',
    '135',
    '140',
  ],
};

/** Parâmetros default completos (seed e testes golden — fonte única). */
export const DEFAULT_RAINFALL_PARAMETERS: RainfallParameters = {
  bands: DEFAULT_RAINFALL_SEVERITY_BANDS,
  ufSeries: BRAZILIAN_UFS.map((uf) => ({
    uf,
    monthlyMm: DEFAULT_PRECIPITATION_MM_BY_UF[uf],
  })),
};

/**
 * Classifica a precipitação na primeira faixa (por posição) cujo limite
 * superior inclusivo a comporta; valores acima de todos os limites caem na
 * faixa aberta. As faixas devem estar validadas (validateRainfallParameters).
 */
export function classifyRainfallBand(
  precipitationMm: number,
  bands: RainfallSeverityBandContract[],
): RainfallSeverityBandContract {
  const ordered = [...bands].sort((a, b) => a.position - b.position);
  for (const band of ordered) {
    if (band.upperLimitMm === null) {
      return band;
    }
    if (precipitationMm <= Number(band.upperLimitMm)) {
      return band;
    }
  }
  // Inalcançável com faixas validadas (a última é sempre aberta).
  return ordered[ordered.length - 1];
}

/**
 * Violações estruturais dos parâmetros de chuva. As mensagens em pt-BR
 * (RNF-14) são responsabilidade da borda consumidora.
 */
export type RainfallParametersViolation =
  | { code: 'no-bands' }
  | { code: 'band-position-duplicated'; position: number }
  | { code: 'band-factor-invalid'; position: number }
  | { code: 'band-factor-out-of-range'; position: number }
  | { code: 'band-limit-invalid'; position: number }
  | { code: 'band-limits-not-increasing'; position: number }
  | { code: 'band-open-not-last'; position: number }
  | { code: 'last-band-not-open' }
  | { code: 'uf-missing'; uf: string }
  | { code: 'uf-unknown'; uf: string }
  | { code: 'uf-duplicated'; uf: string }
  | { code: 'uf-series-length-invalid'; uf: string }
  | { code: 'precipitation-invalid'; uf: string; month: number };

/**
 * Valida a estrutura completa dos parâmetros de chuva: fatores entre 0 e 1,
 * precipitações não negativas, limites estritamente crescentes com a última
 * faixa aberta e matriz cobrindo exatamente as 27 UFs (RNF-09: UF ausente é
 * erro, nunca zero silencioso).
 */
export function validateRainfallParameters(
  params: RainfallParameters,
): RainfallParametersViolation[] {
  const violations: RainfallParametersViolation[] = [];

  const ordered = [...params.bands].sort((a, b) => a.position - b.position);
  if (ordered.length === 0) {
    violations.push({ code: 'no-bands' });
  }

  const seenPositions = new Set<number>();
  for (const band of ordered) {
    if (seenPositions.has(band.position)) {
      violations.push({
        code: 'band-position-duplicated',
        position: band.position,
      });
    }
    seenPositions.add(band.position);
  }

  let previousLimit: number | null = null;
  ordered.forEach((band, index) => {
    const isLast = index === ordered.length - 1;

    if (!POSITIVE_DECIMAL_PATTERN.test(band.productivityFactor)) {
      violations.push({ code: 'band-factor-invalid', position: band.position });
    } else if (Number(band.productivityFactor) > 1) {
      violations.push({
        code: 'band-factor-out-of-range',
        position: band.position,
      });
    }

    if (band.upperLimitMm === null) {
      if (!isLast) {
        violations.push({
          code: 'band-open-not-last',
          position: band.position,
        });
      }
      return;
    }

    if (isLast) {
      violations.push({ code: 'last-band-not-open' });
    }

    if (!POSITIVE_DECIMAL_PATTERN.test(band.upperLimitMm)) {
      violations.push({ code: 'band-limit-invalid', position: band.position });
      return;
    }

    const limit = Number(band.upperLimitMm);
    if (previousLimit !== null && limit <= previousLimit) {
      violations.push({
        code: 'band-limits-not-increasing',
        position: band.position,
      });
    }
    previousLimit = limit;
  });

  const seen = new Set<string>();
  for (const series of params.ufSeries) {
    if (!(BRAZILIAN_UFS as readonly string[]).includes(series.uf)) {
      violations.push({ code: 'uf-unknown', uf: series.uf });
      continue;
    }
    if (seen.has(series.uf)) {
      violations.push({ code: 'uf-duplicated', uf: series.uf });
      continue;
    }
    seen.add(series.uf);

    if (series.monthlyMm.length !== 12) {
      violations.push({ code: 'uf-series-length-invalid', uf: series.uf });
      continue;
    }
    series.monthlyMm.forEach((mm, index) => {
      if (!POSITIVE_DECIMAL_PATTERN.test(mm)) {
        violations.push({
          code: 'precipitation-invalid',
          uf: series.uf,
          month: index + 1,
        });
      }
    });
  }

  for (const uf of BRAZILIAN_UFS) {
    if (!seen.has(uf)) {
      violations.push({ code: 'uf-missing', uf });
    }
  }

  return violations;
}
