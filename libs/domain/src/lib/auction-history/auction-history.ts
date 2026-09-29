/**
 * Contratos do histórico de leilões de transmissão da ANEEL (RF-11, RNF-04):
 * snapshot local do dataset aberto de resultados, log de importações e
 * benchmark de deságio por leilão.
 */

/**
 * Registro cru do datastore CKAN da ANEEL, como publicado — números em texto
 * com vírgula decimal e deságio em fração (armadilhas normalizadas em
 * auction-normalization.ts).
 */
export interface RawAuctionResultRecord {
  AnoLeilao?: number | string | null;
  DatLeilao?: string | null;
  NumLeilao?: string | null;
  NumLoteLeilao?: number | string | null;
  NomEmpreendimento?: string | null;
  SigUFPrincipal?: string | null;
  QtdPrazoConstrucaoMeses?: number | string | null;
  MdaExtensaoLinhaTransmissaoKm?: number | string | null;
  MdaSubEstacoesMVA?: number | string | null;
  VlrInvestimentoPrevisto?: number | string | null;
  VlrRAPEditalLeilao?: number | string | null;
  NomVencedorLeilao?: string | null;
  VlrRAPVencedorLeilao?: number | string | null;
  PctDesagio?: number | string | null;
}

/** Resultado oficial de um lote, normalizado (decimais como string — RNF-08). */
export interface AuctionResultItem {
  id?: number;
  auctionYear: number;
  auctionDate: string | null; // AAAA-MM-DD
  auctionNumber: string; // NNN/AAAA
  lotNumber: number;
  projectName: string;
  mainUf: string | null;
  constructionDeadlineMonths: number | null;
  lineLengthKm: string | null;
  substationMva: string | null;
  estimatedInvestment: string | null;
  maxRap: string | null;
  winnerName: string | null;
  winningRap: string | null;
  discountPercent: string | null;
}

/** Metadados imutáveis de uma importação do histórico. */
export interface AuctionResultImportItem {
  id: number;
  source: string;
  rowCount: number;
  importedBy: string;
  importedAt: string; // ISO 8601
}

/** Estatísticas de deságio de um conjunto de lotes (leilão ou base completa). */
export interface AuctionBenchmark {
  lotCount: number;
  desertedLotCount: number;
  minDiscountPercent: string | null;
  avgDiscountPercent: string | null;
  maxDiscountPercent: string | null;
}

/** Resposta do benchmark para uma oferta (identidade normalizada do leilão). */
export interface AuctionBenchmarkResponse {
  lotResult: AuctionResultItem | null;
  auctionStats: AuctionBenchmark | null;
  overallStats: AuctionBenchmark;
  lastImport: AuctionResultImportItem | null;
}
