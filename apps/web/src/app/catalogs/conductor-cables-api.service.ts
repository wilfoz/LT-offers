import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  ConductorCableHistory,
  ConductorCableSummary,
  NewConductorCableInput,
  NewConductorCableVersionInput,
} from '@lt-offers/domain';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ConductorCablesApi {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/catalogs/conductor-cables';

  list(search?: string): Observable<ConductorCableSummary[]> {
    const params = search ? new HttpParams().set('search', search) : undefined;
    return this.http.get<ConductorCableSummary[]>(this.base, { params });
  }

  history(id: number): Observable<ConductorCableHistory> {
    return this.http.get<ConductorCableHistory>(`${this.base}/${id}/history`);
  }

  create(input: NewConductorCableInput): Observable<unknown> {
    return this.http.post(this.base, input);
  }

  createVersion(
    id: number,
    input: NewConductorCableVersionInput,
  ): Observable<unknown> {
    return this.http.post(`${this.base}/${id}/versions`, input);
  }
}
