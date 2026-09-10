import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  ElectromechanicalSummary,
  TowerTraceabilityDetail,
} from '@lt-offers/domain';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ElectromechanicalApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/lines';

  /**
   * Obtém o resumo consolidado de quantitativos eletromecânicos da linha (M05).
   */
  getLineElectromechanicalSummary(
    lineId: number,
  ): Observable<ElectromechanicalSummary> {
    return this.http.get<ElectromechanicalSummary>(
      `${this.baseUrl}/${lineId}/electromechanical/summary`,
    );
  }

  /**
   * Obtém a rastreabilidade torre a torre da linha (RF-27).
   */
  getLineElectromechanicalTraceability(
    lineId: number,
  ): Observable<TowerTraceabilityDetail[]> {
    return this.http.get<TowerTraceabilityDetail[]>(
      `${this.baseUrl}/${lineId}/electromechanical/traceability`,
    );
  }
}
