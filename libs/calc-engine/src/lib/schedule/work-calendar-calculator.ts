import { DecimalValue } from '../decimal-value';
import {
  CivilMonth,
  WorkCalendarParameters,
  workingDaysInMonth,
} from '@lt-offers/domain';

/**
 * Fator de calendário do cronograma (M07): penaliza a produção mensal das
 * equipes pelos dias não trabalháveis (feriados e dias não laborais da
 * semana) do mês civil. O calendário vigente é resolvido na borda e recebido
 * como entrada (design D2); o motor nunca lê o relógio (RNF-04).
 */
export class WorkCalendarCalculator {
  /**
   * Dias úteis do mês civil, considerando a UF da linha para feriados
   * estaduais (null = só feriados nacionais).
   */
  static getWorkingDays(
    calendar: WorkCalendarParameters,
    civilMonth: CivilMonth,
    uf: string | null,
  ): number {
    return workingDaysInMonth(calendar, civilMonth, uf);
  }

  /**
   * Fator de calendário = dias úteis do mês ÷ dias úteis padrão, arredondado
   * a 4 casas half-up. Pode exceder 1 em mês com mais dias úteis que o
   * padrão (produção nominal é calibrada pelo mês padrão).
   */
  static getCalendarFactor(
    calendar: WorkCalendarParameters,
    civilMonth: CivilMonth,
    uf: string | null,
  ): DecimalValue {
    const workingDays = this.getWorkingDays(calendar, civilMonth, uf);
    const standard = DecimalValue.of(calendar.standardWorkingDaysPerMonth);
    if (standard.isZero()) {
      throw new Error(
        'Calendário de trabalho vigente com dias úteis padrão igual a zero.',
      );
    }
    return DecimalValue.of(workingDays).dividedBy(standard).round(4, 'half-up');
  }
}
