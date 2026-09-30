import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  CatalogImportCommitRequest,
  CatalogImportCommitResult,
  CatalogImportInspectResult,
  CatalogImportPreviewRequest,
  CatalogImportPreviewResult,
} from '@lt-offers/domain';
import { Observable } from 'rxjs';

/**
 * Importação Analítica (design D2): o arquivo sobe no inspect e de novo na
 * prévia; o commit envia só os payloads normalizados aprovados na prévia.
 */
@Injectable({ providedIn: 'root' })
export class CatalogImportApi {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/catalogs/import';

  inspect(file: File): Observable<CatalogImportInspectResult> {
    const body = new FormData();
    body.append('file', file, file.name);
    return this.http.post<CatalogImportInspectResult>(
      `${this.base}/inspect`,
      body,
    );
  }

  preview(
    file: File,
    request: CatalogImportPreviewRequest,
  ): Observable<CatalogImportPreviewResult> {
    const body = new FormData();
    body.append('file', file, file.name);
    body.append('options', JSON.stringify(request));
    return this.http.post<CatalogImportPreviewResult>(
      `${this.base}/preview`,
      body,
    );
  }

  /** O autor vai no header X-User (e-mail: ASCII, seguro em cabeçalho HTTP). */
  commit(
    request: CatalogImportCommitRequest,
    author: string,
  ): Observable<CatalogImportCommitResult> {
    return this.http.post<CatalogImportCommitResult>(
      `${this.base}/commit`,
      request,
      { headers: new HttpHeaders({ 'X-User': author }) },
    );
  }
}
