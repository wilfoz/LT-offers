import { Injectable } from '@nestjs/common';
import { RawAuctionResultRecord } from '@lt-offers/domain';
import {
  AneelDatasetInvalidException,
  AneelSourceUnavailableException,
} from '../../domain/exceptions/auction-history.exceptions';
import { AneelAuctionResultsPort } from '../../domain/ports/aneel-auction-results.port';

const CKAN_BASE_URL =
  'https://dadosabertos.aneel.gov.br/api/3/action/datastore_search';
const RESOURCE_ID = '453cb742-8089-4c16-aaf2-42088b5553dc';
const PAGE_SIZE = 500;
const REQUEST_TIMEOUT_MS = 15_000;
// O dataset tem ~488 linhas; o teto é um freio de segurança contra uma
// resposta com `total` absurdo, não um limite de negócio.
const MAX_PAGES = 50;

interface CkanDatastoreResponse {
  success?: boolean;
  result?: {
    total?: number;
    records?: RawAuctionResultRecord[];
  };
}

/**
 * Adapter HTTP do datastore CKAN da ANEEL: pagina por offset até `total`,
 * com timeout por página. Erros de rede e respostas fora do esquema viram
 * exceções de domínio com mensagem pt-BR — quem decide abortar é o use case.
 */
@Injectable()
export class CkanAneelAuctionResultsAdapter implements AneelAuctionResultsPort {
  async fetchAll(): Promise<{
    source: string;
    records: RawAuctionResultRecord[];
  }> {
    const source = `${CKAN_BASE_URL}?resource_id=${RESOURCE_ID}`;
    const records: RawAuctionResultRecord[] = [];

    for (let page = 0; page < MAX_PAGES; page++) {
      const pageResult = await this.fetchPage(page * PAGE_SIZE);
      records.push(...pageResult.records);
      if (
        pageResult.records.length === 0 ||
        records.length >= pageResult.total
      ) {
        return { source, records };
      }
    }
    // Snapshot truncado nunca substitui o vigente: estourar o freio de
    // segurança é resposta fora do esquema, não sucesso parcial.
    throw new AneelDatasetInvalidException(
      `a paginação excedeu ${MAX_PAGES} páginas sem alcançar o total informado`,
    );
  }

  private async fetchPage(
    offset: number,
  ): Promise<{ total: number; records: RawAuctionResultRecord[] }> {
    const url = `${CKAN_BASE_URL}?resource_id=${RESOURCE_ID}&limit=${PAGE_SIZE}&offset=${offset}`;
    const controller = new AbortController();
    // O timeout cobre a página inteira, corpo incluído: um body travado não
    // pode pendurar a sincronização indefinidamente.
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      let response: Response;
      try {
        response = await fetch(url, { signal: controller.signal });
      } catch (error) {
        throw this.toUnavailable(error);
      }

      if (!response.ok) {
        throw new AneelSourceUnavailableException(
          `o datastore respondeu HTTP ${response.status}`,
        );
      }

      let body: CkanDatastoreResponse;
      try {
        body = (await response.json()) as CkanDatastoreResponse;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw this.toUnavailable(error);
        }
        throw new AneelDatasetInvalidException(
          'o corpo da resposta não é JSON',
        );
      }

      return this.parseBody(body);
    } finally {
      clearTimeout(timeout);
    }
  }

  private toUnavailable(error: unknown): AneelSourceUnavailableException {
    const isTimeout = error instanceof Error && error.name === 'AbortError';
    return new AneelSourceUnavailableException(
      isTimeout
        ? `tempo limite de ${REQUEST_TIMEOUT_MS / 1000}s excedido`
        : 'falha de rede ao consultar o datastore',
    );
  }

  private parseBody(body: CkanDatastoreResponse): {
    total: number;
    records: RawAuctionResultRecord[];
  } {
    const total = body.result?.total;
    const records = body.result?.records;
    if (
      body.success !== true ||
      typeof total !== 'number' ||
      !Array.isArray(records)
    ) {
      throw new AneelDatasetInvalidException(
        'a resposta não contém success/result.total/result.records',
      );
    }

    return { total, records };
  }
}
