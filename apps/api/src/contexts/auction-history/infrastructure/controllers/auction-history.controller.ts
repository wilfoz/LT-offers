import {
  BadGatewayException,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Post,
  Query,
} from '@nestjs/common';
import {
  AuctionBenchmarkResponse,
  AuctionResultImportItem,
} from '@lt-offers/domain';
import { resolveAuthor } from '../../../catalogs/infrastructure/http/controller-shared';
import {
  AneelDatasetInvalidException,
  AneelSourceUnavailableException,
} from '../../domain/exceptions/auction-history.exceptions';
import {
  GetAuctionBenchmarkUseCase,
  ListAuctionResultsUseCase,
  SyncAuctionResultsUseCase,
  AuctionResultsListing,
} from '../../application/usecases';
import {
  AuctionBenchmarkQueryDto,
  ListAuctionResultsQueryDto,
} from '../dto/auction-history-query.dto';

/** Mapeia falhas da fonte externa para HTTP 502 com mensagem pt-BR. */
function handleAuctionHistoryError(error: unknown): never {
  if (
    error instanceof AneelSourceUnavailableException ||
    error instanceof AneelDatasetInvalidException
  ) {
    throw new BadGatewayException(error.message);
  }
  // Erro não tipado aqui é interno (ex.: falha do banco): 500 em pt-BR,
  // sem vazar mensagem crua do Prisma (RNF-14).
  throw new InternalServerErrorException(
    'Erro interno ao processar o histórico de leilões.',
  );
}

/**
 * Histórico oficial de leilões de transmissão da ANEEL (RF-11, RNF-04):
 * consultas servem sempre o snapshot local; a sincronização com o datastore
 * é manual e auditada.
 */
@Controller('auction-history')
export class AuctionHistoryController {
  constructor(
    private readonly syncAuctionResults: SyncAuctionResultsUseCase,
    private readonly listAuctionResults: ListAuctionResultsUseCase,
    private readonly getAuctionBenchmark: GetAuctionBenchmarkUseCase,
  ) {}

  @Post('sync')
  @HttpCode(HttpStatus.CREATED)
  async sync(
    @Headers('x-user') user?: string,
  ): Promise<AuctionResultImportItem> {
    try {
      return await this.syncAuctionResults.execute(resolveAuthor(user));
    } catch (error) {
      handleAuctionHistoryError(error);
    }
  }

  @Get('results')
  async list(
    @Query() query: ListAuctionResultsQueryDto,
  ): Promise<AuctionResultsListing> {
    try {
      return await this.listAuctionResults.execute({
        search: query.search,
        auctionNumber: query.auctionNumber,
        uf: query.uf?.toUpperCase(),
        year: query.year === undefined ? undefined : Number(query.year),
      });
    } catch (error) {
      handleAuctionHistoryError(error);
    }
  }

  @Get('benchmark')
  async benchmark(
    @Query() query: AuctionBenchmarkQueryDto,
  ): Promise<AuctionBenchmarkResponse> {
    try {
      return await this.getAuctionBenchmark.execute(
        query.auctionNumber,
        Number(query.lotNumber),
      );
    } catch (error) {
      handleAuctionHistoryError(error);
    }
  }
}
