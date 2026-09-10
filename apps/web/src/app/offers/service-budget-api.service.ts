import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ServiceBudgetSummary, ServiceBudgetItem } from '@lt-offers/domain';

@Injectable({
  providedIn: 'root',
})
export class ServiceBudgetApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';

  getLineServiceBudget(lineId: number): Observable<ServiceBudgetSummary> {
    return this.http.get<ServiceBudgetSummary>(
      `${this.baseUrl}/lines/${lineId}/services/summary`
    );
  }

  getLineMeasurementSheet(lineId: number): Observable<ServiceBudgetItem[]> {
    return this.http.get<ServiceBudgetItem[]>(
      `${this.baseUrl}/lines/${lineId}/services/measurement-sheet`
    );
  }
}
