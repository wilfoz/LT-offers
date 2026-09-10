import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CashflowSummary } from '@lt-offers/domain';

@Injectable({
  providedIn: 'root',
})
export class CashflowApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';

  getLineCashflow(
    lineId: number,
    options?: { advanceRate?: number; retentionRate?: number; billingLag?: number }
  ): Observable<CashflowSummary> {
    let params = new HttpParams();
    if (options?.advanceRate !== undefined) {
      params = params.set('advanceRate', options.advanceRate.toString());
    }
    if (options?.retentionRate !== undefined) {
      params = params.set('retentionRate', options.retentionRate.toString());
    }
    if (options?.billingLag !== undefined) {
      params = params.set('billingLag', options.billingLag.toString());
    }

    return this.http.get<CashflowSummary>(
      `${this.baseUrl}/lines/${lineId}/cashflow`,
      { params }
    );
  }

  getConsolidatedCashflow(
    offerId: number,
    options?: { advanceRate?: number; retentionRate?: number; billingLag?: number }
  ): Observable<CashflowSummary> {
    let params = new HttpParams();
    if (options?.advanceRate !== undefined) {
      params = params.set('advanceRate', options.advanceRate.toString());
    }
    if (options?.retentionRate !== undefined) {
      params = params.set('retentionRate', options.retentionRate.toString());
    }
    if (options?.billingLag !== undefined) {
      params = params.set('billingLag', options.billingLag.toString());
    }

    return this.http.get<CashflowSummary>(
      `${this.baseUrl}/offers/${offerId}/cashflow/consolidated`,
      { params }
    );
  }
}
