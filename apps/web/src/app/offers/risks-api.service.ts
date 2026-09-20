import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RiskAssessmentSummary, RiskItem } from '@lt-offers/domain';

@Injectable({ providedIn: 'root' })
export class RisksApiService {
  private http = inject(HttpClient);
  private baseUrl = '/api/offers';

  getRisks(
    offerId: string | number,
    lineId?: string,
  ): Observable<RiskAssessmentSummary> {
    const url = `${this.baseUrl}/${offerId}/risks${lineId ? `?lineId=${lineId}` : ''}`;
    return this.http.get<RiskAssessmentSummary>(url);
  }

  saveRisk(
    offerId: string | number,
    item: Partial<RiskItem>,
  ): Observable<RiskAssessmentSummary> {
    return this.http.post<RiskAssessmentSummary>(
      `${this.baseUrl}/${offerId}/risks`,
      item,
    );
  }

  deleteRisk(
    offerId: string | number,
    riskId: string,
    lineId?: string,
  ): Observable<RiskAssessmentSummary> {
    const url = `${this.baseUrl}/${offerId}/risks/${riskId}${lineId ? `?lineId=${lineId}` : ''}`;
    return this.http.delete<RiskAssessmentSummary>(url);
  }
}
