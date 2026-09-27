import { RainfallParameters, WorkCalendarParameters } from '@lt-offers/domain';

/** Versão persistida dos parâmetros de chuva (catálogo singleton, RNF-05). */
export interface RainfallParametersVersionRecord {
  id: number;
  /** Data civil de início de vigência (AAAA-MM-DD). */
  effectiveFrom: string;
  createdBy: string;
  createdAt: string;
  parameters: RainfallParameters;
}

/** Versão persistida do calendário de trabalho (catálogo singleton, RNF-05). */
export interface WorkCalendarVersionRecord {
  id: number;
  effectiveFrom: string;
  createdBy: string;
  createdAt: string;
  calendar: WorkCalendarParameters;
}

export interface CreateRainfallVersionInput {
  effectiveFrom: string;
  createdBy: string;
  parameters: RainfallParameters;
}

export interface CreateWorkCalendarVersionInput {
  effectiveFrom: string;
  createdBy: string;
  calendar: WorkCalendarParameters;
}

/**
 * Porta de persistência dos catálogos de configuração do cronograma:
 * parâmetros de chuva (RN-16) e calendário de trabalho. Versões imutáveis
 * com vigência derivada; a versão vigente é a de maior vigência menor ou
 * igual à data de referência.
 */
export interface ScheduleParametersPort {
  findEffectiveRainfall(
    referenceDate: string,
  ): Promise<RainfallParametersVersionRecord | null>;
  createRainfallVersion(
    input: CreateRainfallVersionInput,
  ): Promise<RainfallParametersVersionRecord>;
  findEffectiveWorkCalendar(
    referenceDate: string,
  ): Promise<WorkCalendarVersionRecord | null>;
  createWorkCalendarVersion(
    input: CreateWorkCalendarVersionInput,
  ): Promise<WorkCalendarVersionRecord>;
}
