/**
 * Normalização do dataset de resultados de leilões da ANEEL (RNF-08, RNF-09):
 * números publicados como texto com vírgula decimal, deságio em fração e
 * número do leilão sem zeros à esquerda. Ausência ou invalidez vira null —
 * nunca zero silencioso. Todas as armadilhas do dataset vivem aqui.
 */

import { Decimal } from 'decimal.js';
import { isValidCivilDate } from '../calendar/work-calendar';
import {
  AuctionBenchmark,
  AuctionResultItem,
  RawAuctionResultRecord,
} from './auction-history';

const DECIMAL_RESULT_PATTERN = /^-?\d+(\.\d+)?$/;

/**
 * Converte número publicado como texto com vírgula decimal (ex.:
 * "2933612926,94") para string decimal exata; separador de milhar com ponto
 * é removido quando há vírgula. Vazio, "-" ou irreconhecível → null.
 */
export function parseAneelDecimal(
  value: number | string | null | undefined,
): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    // Notação de expoente (ex.: 1e21) escaparia do contrato de string decimal.
    const text = String(value);
    return DECIMAL_RESULT_PATTERN.test(text) ? text : null;
  }
  let text = value.trim();
  if (text === '' || text === '-') return null;
  if (text.includes(',')) {
    text = text.replace(/\./g, '').replace(',', '.');
  }
  return DECIMAL_RESULT_PATTERN.test(text) ? text : null;
}

/**
 * Converte deságio publicado como fração (ex.: "0,48") para percentual com
 * duas casas half-up ("48.00"). Entrada ausente/inválida → null.
 */
export function fractionToPercent(
  value: number | string | null | undefined,
): string | null {
  const fraction = parseAneelDecimal(value);
  if (fraction === null) return null;
  return new Decimal(fraction).times(100).toFixed(2);
}

/**
 * Normaliza o número do leilão para NNN/AAAA (ex.: "2/2024" → "002/2024").
 * Formato irreconhecível → null.
 */
export function normalizeAuctionNumber(
  value: string | null | undefined,
): string | null {
  if (value === null || value === undefined) return null;
  const match = value.trim().match(/^(\d{1,3})\/(\d{4})$/);
  if (!match) return null;
  return `${match[1].padStart(3, '0')}/${match[2]}`;
}

/** Inteiro publicado como número ou texto de dígitos; resto → null. */
function parseIntOrNull(
  value: number | string | null | undefined,
): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') {
    return Number.isInteger(value) ? value : null;
  }
  const text = value.trim();
  return /^\d+$/.test(text) ? Number(text) : null;
}

/**
 * Data publicada como ISO (AAAA-MM-DD...) ou dd/mm/aaaa → data civil
 * AAAA-MM-DD validada por round-trip; irreconhecível → null.
 */
function parseAneelDate(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const text = value.trim();
  const iso = text.match(/^(\d{4}-\d{2}-\d{2})/);
  if (iso) {
    return isValidCivilDate(iso[1]) ? iso[1] : null;
  }
  const br = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) {
    const candidate = `${br[3]}-${br[2]}-${br[1]}`;
    return isValidCivilDate(candidate) ? candidate : null;
  }
  return null;
}

function textOrNull(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const text = value.trim();
  return text === '' || text === '-' ? null : text;
}

/**
 * Mapeia um registro cru do datastore para o contrato normalizado. Registro
 * sem identidade mínima (ano, número do leilão, lote e empreendimento) →
 * null: a sincronização aborta em vez de descartar linhas em silêncio.
 * Lote deserto (sem vencedor) grava vencedor, RAP vencedora e deságio como
 * não informados — nunca zero (RNF-09).
 */
export function normalizeAuctionResult(
  raw: RawAuctionResultRecord,
): AuctionResultItem | null {
  const auctionYear = parseIntOrNull(raw.AnoLeilao);
  const auctionNumber = normalizeAuctionNumber(raw.NumLeilao ?? null);
  const lotNumber = parseIntOrNull(raw.NumLoteLeilao);
  const projectName = textOrNull(raw.NomEmpreendimento);
  if (
    auctionYear === null ||
    auctionNumber === null ||
    lotNumber === null ||
    projectName === null
  ) {
    return null;
  }

  const winnerName = textOrNull(raw.NomVencedorLeilao);
  return {
    auctionYear,
    auctionDate: parseAneelDate(raw.DatLeilao),
    auctionNumber,
    lotNumber,
    projectName,
    mainUf: textOrNull(raw.SigUFPrincipal),
    constructionDeadlineMonths: parseIntOrNull(raw.QtdPrazoConstrucaoMeses),
    lineLengthKm: parseAneelDecimal(raw.MdaExtensaoLinhaTransmissaoKm),
    substationMva: parseAneelDecimal(raw.MdaSubEstacoesMVA),
    estimatedInvestment: parseAneelDecimal(raw.VlrInvestimentoPrevisto),
    maxRap: parseAneelDecimal(raw.VlrRAPEditalLeilao),
    winnerName,
    winningRap:
      winnerName === null ? null : parseAneelDecimal(raw.VlrRAPVencedorLeilao),
    discountPercent:
      winnerName === null ? null : fractionToPercent(raw.PctDesagio),
  };
}

/**
 * Estatísticas de deságio de um conjunto de lotes: mínimo, médio e máximo
 * (duas casas half-up) sobre os deságios informados; lote deserto = sem
 * vencedor. Lista vazia → contagens zero e estatísticas não informadas.
 */
export function auctionBenchmark(
  rows: Pick<AuctionResultItem, 'discountPercent' | 'winnerName'>[],
): AuctionBenchmark {
  const discounts = rows
    .map((row) => row.discountPercent)
    .filter((value): value is string => value !== null)
    .map((value) => new Decimal(value));

  let min: Decimal | null = null;
  let max: Decimal | null = null;
  let sum = new Decimal(0);
  for (const discount of discounts) {
    if (min === null || discount.lessThan(min)) min = discount;
    if (max === null || discount.greaterThan(max)) max = discount;
    sum = sum.plus(discount);
  }

  return {
    lotCount: rows.length,
    desertedLotCount: rows.filter((row) => row.winnerName === null).length,
    minDiscountPercent: min === null ? null : min.toFixed(2),
    avgDiscountPercent:
      discounts.length === 0
        ? null
        : sum.dividedBy(discounts.length).toFixed(2),
    maxDiscountPercent: max === null ? null : max.toFixed(2),
  };
}
