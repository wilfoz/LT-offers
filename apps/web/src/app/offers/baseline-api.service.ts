import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ContractChangeOrder,
  CreateBaselinePayload,
  CreateChangeOrderPayload,
  CurrentWorkingEstimate,
  CurveSData,
  ErpIntegrationPackage,
  GenerateErpPackagePayload,
  MonthlyProgressRecord,
  RecordMonthlyProgressPayload,
  UpdateChangeOrderPayload,
  WorkBaseline,
} from '@lt-offers/domain';

@Injectable({
  providedIn: 'root',
})
export class BaselineApiService {
  private readonly baseUrl = '/api/offers';

  private readonly http = inject(HttpClient);

  getBaseline(offerId: number): Observable<WorkBaseline> {
    return this.http.get<WorkBaseline>(`${this.baseUrl}/${offerId}/baseline`);
  }

  freezeBaseline(
    offerId: number,
    payload: Partial<CreateBaselinePayload>,
  ): Observable<WorkBaseline> {
    return this.http.post<WorkBaseline>(
      `${this.baseUrl}/${offerId}/baseline/freeze`,
      payload,
    );
  }

  getCurveS(offerId: number, baselineId?: number): Observable<CurveSData> {
    const url = baselineId
      ? `${this.baseUrl}/${offerId}/curve-s?baselineId=${baselineId}`
      : `${this.baseUrl}/${offerId}/curve-s`;
    return this.http.get<CurveSData>(url);
  }

  recordMonthlyProgress(
    offerId: number,
    payload: RecordMonthlyProgressPayload,
  ): Observable<MonthlyProgressRecord> {
    return this.http.post<MonthlyProgressRecord>(
      `${this.baseUrl}/${offerId}/progress-records`,
      payload,
    );
  }

  listProgressRecords(
    offerId: number,
    baselineId?: number,
  ): Observable<MonthlyProgressRecord[]> {
    const url = baselineId
      ? `${this.baseUrl}/${offerId}/progress-records?baselineId=${baselineId}`
      : `${this.baseUrl}/${offerId}/progress-records`;
    return this.http.get<MonthlyProgressRecord[]>(url);
  }

  listChangeOrders(
    offerId: number,
    baselineId?: number,
  ): Observable<ContractChangeOrder[]> {
    const url = baselineId
      ? `${this.baseUrl}/${offerId}/change-orders?baselineId=${baselineId}`
      : `${this.baseUrl}/${offerId}/change-orders`;
    return this.http.get<ContractChangeOrder[]>(url);
  }

  createChangeOrder(
    offerId: number,
    payload: CreateChangeOrderPayload,
  ): Observable<ContractChangeOrder> {
    return this.http.post<ContractChangeOrder>(
      `${this.baseUrl}/${offerId}/change-orders`,
      payload,
    );
  }

  updateChangeOrder(
    offerId: number,
    changeOrderId: number,
    payload: UpdateChangeOrderPayload & { baselineId?: number },
  ): Observable<ContractChangeOrder> {
    return this.http.put<ContractChangeOrder>(
      `${this.baseUrl}/${offerId}/change-orders/${changeOrderId}`,
      payload,
    );
  }

  getCurrentWorkingEstimate(
    offerId: number,
    baselineId?: number,
  ): Observable<CurrentWorkingEstimate> {
    const url = baselineId
      ? `${this.baseUrl}/${offerId}/cwe?baselineId=${baselineId}`
      : `${this.baseUrl}/${offerId}/cwe`;
    return this.http.get<CurrentWorkingEstimate>(url);
  }

  generateErpPackageJson(
    offerId: number,
    payload: Partial<GenerateErpPackagePayload>,
  ): Observable<ErpIntegrationPackage> {
    return this.http.post<ErpIntegrationPackage>(
      `${this.baseUrl}/${offerId}/erp-package`,
      payload,
    );
  }

  exportErpPackageXlsx(
    offerId: number,
    payload: Partial<GenerateErpPackagePayload>,
  ): Observable<Blob> {
    return this.http.post(
      `${this.baseUrl}/${offerId}/erp-package/export-xlsx`,
      payload,
      {
        responseType: 'blob',
      },
    );
  }
}
