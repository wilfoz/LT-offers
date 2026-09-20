import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OfferHealthSummary } from '@lt-offers/domain';

@Injectable({ providedIn: 'root' })
export class ChecksApiService {
  private http = inject(HttpClient);
  private baseUrl = '/api/offers';

  getHealthChecks(offerId: string | number): Observable<OfferHealthSummary> {
    return this.http.get<OfferHealthSummary>(
      `${this.baseUrl}/${offerId}/checks`,
    );
  }
}
