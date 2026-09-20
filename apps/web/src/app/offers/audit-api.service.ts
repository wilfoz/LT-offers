import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuditEvent, AuditFilter } from '@lt-offers/domain';

@Injectable({
  providedIn: 'root',
})
export class AuditApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/audit';

  /**
   * Consulta a trilha de auditoria filtrada (RF-65, RNF-12).
   */
  getEvents(filter?: AuditFilter): Observable<AuditEvent[]> {
    let params = new HttpParams();

    if (filter) {
      if (filter.offerId) params = params.set('offerId', filter.offerId);
      if (filter.resource) params = params.set('resource', filter.resource);
      if (filter.userId) params = params.set('userId', filter.userId);
      if (filter.action) params = params.set('action', filter.action);
      if (filter.startDate) params = params.set('startDate', filter.startDate);
      if (filter.endDate) params = params.set('endDate', filter.endDate);
    }

    return this.http.get<AuditEvent[]>(this.baseUrl, { params });
  }

  /**
   * Registra manualmente um evento de auditoria.
   */
  logEvent(
    event: Omit<AuditEvent, 'id' | 'timestamp'>,
  ): Observable<AuditEvent> {
    return this.http.post<AuditEvent>(`${this.baseUrl}/log`, event);
  }
}
