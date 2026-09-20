import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ScheduleSummary, CampCostSummary } from '@lt-offers/domain';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ScheduleApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/lines';

  /**
   * Obtém o resumo do cronograma físico da linha (M07).
   */
  getLineSchedule(lineId: number): Observable<ScheduleSummary> {
    return this.http.get<ScheduleSummary>(
      `${this.baseUrl}/${lineId}/schedule/summary`,
    );
  }

  /**
   * Obtém os custos e dimensionamento de canteiros da linha (RF-41).
   */
  getLineCamps(lineId: number): Observable<CampCostSummary> {
    return this.http.get<CampCostSummary>(
      `${this.baseUrl}/${lineId}/schedule/camps`,
    );
  }
}
