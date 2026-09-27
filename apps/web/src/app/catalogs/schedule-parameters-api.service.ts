import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  RainfallParameters,
  RainfallSeverityBandContract,
  RainfallUfSeriesContract,
  WorkCalendarParameters,
  HolidayContract,
} from '@lt-offers/domain';

/** Versão vigente dos parâmetros de chuva devolvida pela API. */
export interface RainfallParametersVersion {
  id: number;
  effectiveFrom: string;
  createdBy: string;
  createdAt: string;
  parameters: RainfallParameters;
}

/** Versão vigente do calendário de trabalho devolvida pela API. */
export interface WorkCalendarVersion {
  id: number;
  effectiveFrom: string;
  createdBy: string;
  createdAt: string;
  calendar: WorkCalendarParameters;
}

export interface NewRainfallVersionInput {
  effectiveFrom: string;
  bands: RainfallSeverityBandContract[];
  ufSeries: RainfallUfSeriesContract[];
}

export interface NewWorkCalendarVersionInput {
  effectiveFrom: string;
  standardWorkingDaysPerMonth: string;
  nonWorkingWeekdays: number[];
  holidays: HolidayContract[];
}

/**
 * Catálogos singleton de configuração do cronograma (M07): parâmetros de
 * chuva (RN-16) e calendário de trabalho, versionados por vigência (RNF-05).
 */
@Injectable({ providedIn: 'root' })
export class ScheduleParametersApi {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/schedule-parameters';

  getRainfall(): Observable<RainfallParametersVersion> {
    return this.http.get<RainfallParametersVersion>(`${this.base}/rainfall`);
  }

  createRainfallVersion(
    input: NewRainfallVersionInput,
  ): Observable<RainfallParametersVersion> {
    return this.http.post<RainfallParametersVersion>(
      `${this.base}/rainfall`,
      input,
    );
  }

  getWorkCalendar(): Observable<WorkCalendarVersion> {
    return this.http.get<WorkCalendarVersion>(`${this.base}/work-calendar`);
  }

  createWorkCalendarVersion(
    input: NewWorkCalendarVersionInput,
  ): Observable<WorkCalendarVersion> {
    return this.http.post<WorkCalendarVersion>(
      `${this.base}/work-calendar`,
      input,
    );
  }
}
