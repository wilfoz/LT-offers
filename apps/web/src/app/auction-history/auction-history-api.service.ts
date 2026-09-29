import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  AuctionBenchmarkResponse,
  AuctionResultImportItem,
  AuctionResultItem,
} from '@lt-offers/domain';
import { Observable } from 'rxjs';

export interface AuctionResultsListing {
  results: AuctionResultItem[];
  lastImport: AuctionResultImportItem | null;
}

export interface AuctionResultsFilter {
  search?: string;
  auctionNumber?: string;
  uf?: string;
  year?: string;
}

@Injectable({ providedIn: 'root' })
export class AuctionHistoryApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/auction-history';

  list(filter: AuctionResultsFilter = {}): Observable<AuctionResultsListing> {
    let params = new HttpParams();
    if (filter.search?.trim())
      params = params.set('search', filter.search.trim());
    if (filter.auctionNumber?.trim())
      params = params.set('auctionNumber', filter.auctionNumber.trim());
    if (filter.uf?.trim()) params = params.set('uf', filter.uf.trim());
    if (filter.year?.trim()) params = params.set('year', filter.year.trim());
    return this.http.get<AuctionResultsListing>(`${this.baseUrl}/results`, {
      params,
    });
  }

  sync(): Observable<AuctionResultImportItem> {
    return this.http.post<AuctionResultImportItem>(`${this.baseUrl}/sync`, {});
  }

  benchmark(
    auctionNumber: string,
    lotNumber: number,
  ): Observable<AuctionBenchmarkResponse> {
    const params = new HttpParams()
      .set('auctionNumber', auctionNumber)
      .set('lotNumber', String(lotNumber));
    return this.http.get<AuctionBenchmarkResponse>(
      `${this.baseUrl}/benchmark`,
      {
        params,
      },
    );
  }
}
