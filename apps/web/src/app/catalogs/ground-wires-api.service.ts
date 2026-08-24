import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  GroundWireHistory,
  GroundWireSummary,
  GroundWireType,
  NewGroundWireInput,
  NewGroundWireVersionInput,
} from '@lt-offers/domain';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GroundWiresApi {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/catalogs/ground-wires';

  list(
    search?: string,
    type?: GroundWireType,
  ): Observable<GroundWireSummary[]> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    if (type) {
      params = params.set('type', type);
    }
    return this.http.get<GroundWireSummary[]>(this.base, { params });
  }

  history(id: number): Observable<GroundWireHistory> {
    return this.http.get<GroundWireHistory>(`${this.base}/${id}/history`);
  }

  create(input: NewGroundWireInput): Observable<unknown> {
    return this.http.post(this.base, input);
  }

  createVersion(
    id: number,
    input: NewGroundWireVersionInput,
  ): Observable<unknown> {
    return this.http.post(`${this.base}/${id}/versions`, input);
  }
}
