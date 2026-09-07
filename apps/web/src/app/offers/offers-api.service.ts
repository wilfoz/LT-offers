import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  CloneOfferPayload,
  CreateNewRevisionPayload,
  CreateOfferPayload,
  OfferDetail,
  OfferSummary,
  UpdateOfferGeneralPayload,
  UpdateOfferRevisionPayload,
} from '@lt-offers/domain';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class OffersApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/offers';

  list(search?: string): Observable<OfferSummary[]> {
    let params = new HttpParams();
    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }
    return this.http.get<OfferSummary[]>(this.baseUrl, { params });
  }

  getById(id: number): Observable<OfferDetail> {
    return this.http.get<OfferDetail>(`${this.baseUrl}/${id}`);
  }

  getByCode(code: string): Observable<OfferDetail> {
    return this.http.get<OfferDetail>(`${this.baseUrl}/code/${encodeURIComponent(code)}`);
  }

  create(payload: CreateOfferPayload): Observable<OfferDetail> {
    return this.http.post<OfferDetail>(this.baseUrl, payload);
  }

  updateGeneral(id: number, payload: UpdateOfferGeneralPayload): Observable<OfferDetail> {
    return this.http.patch<OfferDetail>(`${this.baseUrl}/${id}`, payload);
  }

  updateRevision(
    offerId: number,
    revisionNumber: number,
    payload: UpdateOfferRevisionPayload,
  ): Observable<OfferDetail> {
    return this.http.put<OfferDetail>(
      `${this.baseUrl}/${offerId}/revisions/${revisionNumber}`,
      payload,
    );
  }

  createNewRevision(
    offerId: number,
    payload: CreateNewRevisionPayload,
  ): Observable<OfferDetail> {
    return this.http.post<OfferDetail>(
      `${this.baseUrl}/${offerId}/revisions`,
      payload,
    );
  }

  clone(offerId: number, payload: CloneOfferPayload): Observable<OfferDetail> {
    return this.http.post<OfferDetail>(
      `${this.baseUrl}/${offerId}/clone`,
      payload,
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
