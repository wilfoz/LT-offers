import { HttpClient, HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';

/**
 * Base dos serviços de API dos catálogos versionados (design D4 da change
 * catalogo-cabos-tirante): rotas list/history/create/createVersion sobre uma
 * URL base. Variações reais (ex.: filtro por tipo) ficam nos filhos.
 */
export abstract class VersionedCatalogApi<
  TSummary,
  THistory,
  TNew,
  TNewVersion,
> {
  protected readonly http = inject(HttpClient);

  protected constructor(protected readonly base: string) {}

  list(search?: string): Observable<TSummary[]> {
    const params = search ? new HttpParams().set('search', search) : undefined;
    return this.http.get<TSummary[]>(this.base, { params });
  }

  history(id: number): Observable<THistory> {
    return this.http.get<THistory>(`${this.base}/${id}/history`);
  }

  create(input: TNew): Observable<unknown> {
    return this.http.post(this.base, input);
  }

  createVersion(id: number, input: TNewVersion): Observable<unknown> {
    return this.http.post(`${this.base}/${id}/versions`, input);
  }
}
