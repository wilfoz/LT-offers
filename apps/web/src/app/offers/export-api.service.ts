import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  TenderSheetLayout,
  TenderSheetExportData,
  MeasurementSheetExportData,
  CashflowExportData,
  PerformanceIndicatorsSummary,
  FullOfferPackage,
} from '@lt-offers/domain';

@Injectable({
  providedIn: 'root',
})
export class ExportApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/offers';

  /**
   * Obtém os indicadores sintéticos consolidados da proposta (RF-49).
   */
  getPerformanceIndicators(
    offerId: number,
  ): Observable<PerformanceIndicatorsSummary> {
    return this.http.get<PerformanceIndicatorsSummary>(
      `${this.baseUrl}/${offerId}/export/performance-indicators`,
    );
  }

  /**
   * Obtém a estrutura JSON de dados da Planilha de Preços do Edital.
   */
  getTenderSheetData(
    offerId: number,
    layout: TenderSheetLayout = 'ANEEL_STANDARD',
  ): Observable<TenderSheetExportData> {
    const params = new HttpParams().set('layout', layout);
    return this.http.get<TenderSheetExportData>(
      `${this.baseUrl}/${offerId}/export/tender-sheet/data`,
      { params },
    );
  }

  /**
   * Faz o download do arquivo binário XLSX da Planilha de Preços do Edital (RF-47, RF-50, RNF-11).
   */
  downloadTenderSheet(
    offerId: number,
    layout: TenderSheetLayout = 'ANEEL_STANDARD',
  ): Observable<Blob> {
    const params = new HttpParams().set('layout', layout);
    return this.http.get(`${this.baseUrl}/${offerId}/export/tender-sheet`, {
      params,
      responseType: 'blob',
    });
  }

  /**
   * Obtém os dados estruturados da Folha de Medição e PUs em JSON.
   */
  getMeasurementSheetData(
    offerId: number,
  ): Observable<MeasurementSheetExportData> {
    return this.http.get<MeasurementSheetExportData>(
      `${this.baseUrl}/${offerId}/export/measurement-sheet/data`,
    );
  }

  /**
   * Faz o download do arquivo binário XLSX da Folha de Medição Contratual e PUs (RF-48, RNF-11).
   */
  downloadMeasurementSheet(offerId: number): Observable<Blob> {
    return this.http.get(
      `${this.baseUrl}/${offerId}/export/measurement-sheet`,
      {
        responseType: 'blob',
      },
    );
  }

  /**
   * Obtém os dados estruturados do Cronograma de Faturamento em JSON.
   */
  getCashflowExportData(offerId: number): Observable<CashflowExportData> {
    return this.http.get<CashflowExportData>(
      `${this.baseUrl}/${offerId}/export/cashflow-schedule/data`,
    );
  }

  /**
   * Faz o download do arquivo binário XLSX do Cronograma de Faturamento e Desembolso (RF-60, RNF-11).
   */
  downloadCashflowSheet(offerId: number): Observable<Blob> {
    return this.http.get(
      `${this.baseUrl}/${offerId}/export/cashflow-schedule`,
      {
        responseType: 'blob',
      },
    );
  }

  /**
   * Faz o download do Pacote Aberto Integral da Oferta em JSON (RNF-18).
   */
  getFullOfferPackage(offerId: number): Observable<FullOfferPackage> {
    return this.http.get<FullOfferPackage>(
      `${this.baseUrl}/${offerId}/export/full-package`,
    );
  }

  /**
   * Helper para disparar o download de um Blob no navegador.
   */
  saveBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Helper para disparar o download de um objeto JSON no navegador.
   */
  saveJson(data: unknown, filename: string): void {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    this.saveBlob(blob, filename);
  }
}
